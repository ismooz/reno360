import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
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

    // Check if user is admin using the database function (secure, not user_metadata)
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('is_admin', { check_user_id: user.id });
    
    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch all users using admin client
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
