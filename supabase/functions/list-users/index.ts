import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the current user to verify admin role
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin using the database function (secure, not user_metadata)
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('is_admin', { check_user_id: user.id });
    
    if (roleError) {
      console.error("Error checking admin role:", roleError);
      throw new Error("Failed to verify admin role");
    }
    
    if (!isAdmin) {
      throw new Error("Access denied - admin role required");
    }

    // Fetch all users using admin client
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    // Format users data for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      role: user.user_metadata?.role || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone || '',
      status: user.email_confirmed_at ? 'active' : 'pending'
    }));

    console.log(`Successfully fetched ${formattedUsers.length} users`);

    return new Response(JSON.stringify({ users: formattedUsers }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in list-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") || error.message.includes("Access denied") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
