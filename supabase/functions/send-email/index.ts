import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// SECURITY: Restrict CORS to known origins
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://fbkprtfdoeoazfgmsecm.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = (await req.json()) as EmailRequest;

    console.log("=== SEND EMAIL REQUEST (Resend) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", from || "default");

    // Get configured sender from secrets or use default
    const configuredFrom = Deno.env.get("SMTP_FROM") || from || "Reno360 <onboarding@resend.dev>";
    
    // Format the from address for Resend
    let fromAddress = configuredFrom;
    if (!configuredFrom.includes('<')) {
      fromAddress = `Reno360 <${configuredFrom}>`;
    }

    console.log("Using from address:", fromAddress);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: `Erreur Resend: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    console.log("Resend response:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé avec succès.", data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Email function error:", error.stack || error.message);
    return new Response(
      JSON.stringify({ error: `Erreur lors de l'envoi: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
