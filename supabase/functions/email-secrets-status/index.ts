import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Create a Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin using the database function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('is_admin', { check_user_id: user.id });
    
    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin role" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Access denied - admin role required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only admins can see secrets status
    const status: SecretsStatus = {
      SMTP_HOST: !!Deno.env.get("SMTP_HOST"),
      SMTP_PORT: !!Deno.env.get("SMTP_PORT"),
      SMTP_USER: !!Deno.env.get("SMTP_USER"),
      SMTP_PASS: !!Deno.env.get("SMTP_PASS"),
      SMTP_FROM: !!Deno.env.get("SMTP_FROM"),
      SMTP_TLS: !!Deno.env.get("SMTP_TLS"),
    };

    console.log(`Admin ${user.id} checked secrets status`);

    return new Response(JSON.stringify({ status }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in email-secrets-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
