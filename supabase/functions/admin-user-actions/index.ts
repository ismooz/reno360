import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://lovable.dev",
  "https://preview--reno360-renovation.lovable.app",
  "https://reno360-renovation.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface AdminActionRequest {
  action: 'send_reset_link' | 'set_temp_password' | 'force_password_change';
  userId: string;
  email?: string;
  tempPassword?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request has authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client with service role for admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Create client with user token to verify admin status
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if current user is admin
    const { data: isAdmin, error: adminError } = await supabaseUser.rpc('is_admin', { 
      check_user_id: currentUser.id 
    });
    
    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body: AdminActionRequest = await req.json();
    const { action, userId, email, tempPassword } = body;

    console.log(`Admin action: ${action} for user ${userId}`);

    switch (action) {
      case 'send_reset_link': {
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Generate password reset link using admin API
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${req.headers.get('origin') || 'https://reno360-renovation.lovable.app'}/auth?type=recovery`
          }
        });

        if (linkError) {
          console.error('Failed to generate reset link:', linkError);
          return new Response(
            JSON.stringify({ error: 'Failed to generate reset link' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Send the reset email using our send-email function
        const resetUrl = linkData.properties?.action_link;
        if (resetUrl) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                to: email,
                subject: 'Réinitialisation de votre mot de passe - Reno360',
                html: `
                  <h1>Réinitialisation de mot de passe</h1>
                  <p>Un administrateur a demandé la réinitialisation de votre mot de passe.</p>
                  <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                  <p><a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
                  <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                  <p>Cordialement,<br>L'équipe Reno360</p>
                `
              })
            });
          } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            // Continue anyway - the link was generated
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Reset link sent successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'set_temp_password': {
        if (!tempPassword) {
          return new Response(
            JSON.stringify({ error: 'Temporary password is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Update user's password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          user_metadata: {
            must_change_password: true,
            temp_password_set_at: new Date().toISOString()
          }
        });

        if (updateError) {
          console.error('Failed to set temporary password:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to set temporary password' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Send notification email if email provided
        if (email) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                to: email,
                subject: 'Nouveau mot de passe temporaire - Reno360',
                html: `
                  <h1>Mot de passe temporaire</h1>
                  <p>Un administrateur vous a attribué un nouveau mot de passe temporaire.</p>
                  <p><strong>Important :</strong> Vous devrez changer ce mot de passe lors de votre prochaine connexion.</p>
                  <p>Votre mot de passe temporaire est : <code style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
                  <p>Connectez-vous sur <a href="${req.headers.get('origin') || 'https://reno360-renovation.lovable.app'}/auth">Reno360</a> pour accéder à votre compte.</p>
                  <p>Cordialement,<br>L'équipe Reno360</p>
                `
              })
            });
          } catch (emailError) {
            console.error('Failed to send temp password email:', emailError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Temporary password set successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'force_password_change': {
        // Mark user as needing to change password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            must_change_password: true
          }
        });

        if (updateError) {
          console.error('Failed to force password change:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to force password change' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Password change required on next login' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
