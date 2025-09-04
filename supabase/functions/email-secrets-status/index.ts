import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SecretsStatus {
  SMTP_HOST: boolean;
  SMTP_PORT: boolean;
  SMTP_USER: boolean;
  SMTP_PASS: boolean;
  SMTP_FROM: boolean;
  SMTP_TLS: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const status: SecretsStatus = {
      SMTP_HOST: !!Deno.env.get("SMTP_HOST"),
      SMTP_PORT: !!Deno.env.get("SMTP_PORT"),
      SMTP_USER: !!Deno.env.get("SMTP_USER"),
      SMTP_PASS: !!Deno.env.get("SMTP_PASS"),
      SMTP_FROM: !!Deno.env.get("SMTP_FROM"),
      SMTP_TLS: !!Deno.env.get("SMTP_TLS"),
    };

    return new Response(JSON.stringify({ status }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});