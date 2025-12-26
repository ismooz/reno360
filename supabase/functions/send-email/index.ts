import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function isAllowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const host = url.hostname;

    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".lovableproject.com")) return true;
    if (host.endsWith(".lovable.app")) return true;

    return false;
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

function formatFromAddress(value: string) {
  // Resend expects: "Name <email@domain>" or plain "email@domain"
  if (value.includes("<") && value.includes(">")) return value;
  if (value.includes("@")) return `Reno360 <${value}>`;
  return "Reno360 <onboarding@resend.dev>";
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = (await req.json()) as EmailRequest;

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Paramètres manquants: to, subject, html" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("=== SEND EMAIL REQUEST (Resend) ===");
    console.log("To:", to);
    console.log("Subject:", subject);

    const defaultFrom = "Reno360 <onboarding@resend.dev>";
    const preferredFromRaw = Deno.env.get("SMTP_FROM") || from || defaultFrom;
    const preferredFrom = formatFromAddress(preferredFromRaw);

    const sendWithFrom = async (fromAddress: string) => {
      console.log("Using from address:", fromAddress);
      return await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html,
      });
    };

    let { data, error } = await sendWithFrom(preferredFrom);

    // Common issue: custom domain not verified in Resend → fallback to onboarding@resend.dev
    if (error && preferredFrom !== defaultFrom) {
      console.warn("Resend error with preferred from, retrying with defaultFrom:", error);
      const retry = await sendWithFrom(defaultFrom);
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: `Erreur Resend: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    console.log("Resend response:", data);

    return new Response(JSON.stringify({ success: true, message: "Email envoyé avec succès.", data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Email function error:", error?.stack || error?.message || error);
    return new Response(JSON.stringify({ error: `Erreur lors de l'envoi: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
