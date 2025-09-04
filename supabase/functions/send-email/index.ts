import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from = "Reno360 <noreply@reno360.ch>" }: EmailRequest = await req.json();

    console.log("Sending email to:", to, "Subject:", subject);

    // Simulation d'envoi d'email - remplacer par votre service SMTP si nécessaire
    const emailResponse = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to: [to],
      subject,
      html,
      status: "sent",
      timestamp: new Date().toISOString()
    };

    // Ici vous pouvez intégrer votre propre service SMTP
    // Exemple avec nodemailer ou autre service d'email
    
    console.log("Email simulated successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);