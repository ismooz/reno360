import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

    console.log("=== SEND EMAIL REQUEST ===");
    console.log("To:", to);
    console.log("Subject:", subject);

    // Load SMTP credentials from Supabase secrets
    const envHost = Deno.env.get("SMTP_HOST") ?? "";
    const envPort = Deno.env.get("SMTP_PORT") ?? "";
    const envUser = Deno.env.get("SMTP_USER") ?? "";
    const envPass = Deno.env.get("SMTP_PASS") ?? "";
    const envFrom = Deno.env.get("SMTP_FROM") ?? "";
    const envTls = (Deno.env.get("SMTP_TLS") ?? "true").toLowerCase() === "true";

    let smtpConfig = {
      host: envHost,
      port: envPort ? Number(envPort) : 587,
      username: envUser,
      password: envPass,
      from: envFrom || from || "",
      useTLS: envTls,
    };

    // Database fallback for non-sensitive settings only
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.from) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: config, error: configError } = await supabaseClient
          .from("smtp_config")
          .select("*")
          .eq("id", 1)
          .single();

        if (configError) {
          console.warn("smtp_config fallback unavailable:", configError.message);
        }

        if (config) {
          smtpConfig = {
            host: smtpConfig.host || config.host,
            port: smtpConfig.port || config.port || 587,
            username: smtpConfig.username || config.username,
            password: smtpConfig.password,
            from: smtpConfig.from || config.from_address || "",
            useTLS: smtpConfig.useTLS ?? (config.use_tls ?? true),
          };
        }
      } catch (e) {
        console.warn("Error while attempting smtp_config fallback:", (e as Error).message);
      }
    }

    console.log("=== SMTP CONFIG ===");
    console.log("Host:", smtpConfig.host);
    console.log("Port:", smtpConfig.port);
    console.log("Username:", smtpConfig.username);
    console.log("From:", smtpConfig.from);
    console.log("Use TLS:", smtpConfig.useTLS);
    console.log("Password set:", !!smtpConfig.password);

    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.from) {
      console.error("SMTP configuration incomplete - missing required fields");
      console.error("Missing: ", {
        host: !smtpConfig.host,
        port: !smtpConfig.port,
        username: !smtpConfig.username,
        password: !smtpConfig.password,
        from: !smtpConfig.from,
      });
      return new Response(
        JSON.stringify({ error: "Configuration email incomplète. Veuillez vérifier les secrets SMTP." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Attempting SMTP connection to", smtpConfig.host, ":", smtpConfig.port);

    let conn;
    try {
      conn = await Deno.connect({
        hostname: smtpConfig.host,
        port: smtpConfig.port,
      });
      console.log("TCP connection established");
    } catch (error) {
      console.error("SMTP connection failed:", error);
      return new Response(
        JSON.stringify({ error: `Impossible de se connecter au serveur SMTP ${smtpConfig.host}:${smtpConfig.port}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(2048);
      const n = await conn.read(buffer);
      const responseText = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`S: ${responseText.trim()}`);
      return responseText;
    };

    const sendCommand = async (command: string): Promise<string> => {
      // Don't log credentials
      const logCommand = command.startsWith("AUTH") || 
                         /^[A-Za-z0-9+/=]+$/.test(command) ? 
                         "[CREDENTIALS]" : command;
      console.log(`C: ${logCommand}`);
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    try {
      // Initial greeting
      const greeting = await readResponse();
      console.log("Server greeting received");
      
      // EHLO command
      const ehloResponse = await sendCommand(`EHLO ${smtpConfig.host}`);
      console.log("EHLO response received");

      // Handle STARTTLS for Infomaniak and other providers
      if (smtpConfig.useTLS && smtpConfig.port !== 465) {
        console.log("Attempting STARTTLS...");
        const startTlsResponse = await sendCommand("STARTTLS");
        
        if (startTlsResponse.startsWith("220")) {
          console.log("STARTTLS accepted, upgrading connection...");
          try {
            // @ts-ignore: Deno.startTls is a Deno-specific API
            conn = await Deno.startTls(conn, { hostname: smtpConfig.host });
            console.log("TLS connection established");
            
            // Re-issue EHLO after TLS
            const ehloAfterTls = await sendCommand(`EHLO ${smtpConfig.host}`);
            console.log("EHLO after TLS received");
          } catch (tlsError) {
            console.error("TLS upgrade failed:", tlsError);
            return new Response(
              JSON.stringify({ error: "Échec de l'établissement de la connexion TLS" }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        } else {
          console.warn("STARTTLS not supported or failed:", startTlsResponse);
          // Continue without TLS if server doesn't support it
        }
      }

      // Authentication
      console.log("Starting authentication...");
      await sendCommand("AUTH LOGIN");
      await sendCommand(base64Encode(encoder.encode(smtpConfig.username)));
      const authResponse = await sendCommand(base64Encode(encoder.encode(smtpConfig.password)));
      
      if (!authResponse.startsWith("235")) {
        console.error("SMTP authentication failed:", authResponse);
        return new Response(
          JSON.stringify({ error: "Échec de l'authentification SMTP. Vérifiez le nom d'utilisateur et le mot de passe." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      console.log("Authentication successful");
      
      // For Infomaniak: MAIL FROM must match the authenticated user
      const envelopeSender = smtpConfig.username;
      const displayFrom = smtpConfig.from;

      console.log("Sending MAIL FROM:", envelopeSender);
      const mailFromResponse = await sendCommand(`MAIL FROM:<${envelopeSender}>`);
      if (!mailFromResponse.startsWith("250")) {
        console.error("MAIL FROM rejected:", mailFromResponse);
        return new Response(
          JSON.stringify({ error: `L'expéditeur a été refusé: ${mailFromResponse}` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Sending RCPT TO:", to);
      const rcptToResponse = await sendCommand(`RCPT TO:<${to}>`);
      if (!rcptToResponse.startsWith("250")) {
        console.error("RCPT TO rejected:", rcptToResponse);
        return new Response(
          JSON.stringify({ error: `Le destinataire a été refusé: ${rcptToResponse}` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const dataResponse = await sendCommand("DATA");
      if (!dataResponse.startsWith("354")) {
        console.error("DATA command rejected:", dataResponse);
        return new Response(
          JSON.stringify({ error: "Le serveur a refusé les données" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Create text version from HTML
      const textContent = html
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

      const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${smtpConfig.host}>`;
      const boundary = `boundary_${Math.random().toString(36).substr(2, 15)}`;
      
      const headers = [
        `Message-ID: ${messageId}`,
        `From: Reno360 <${displayFrom}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `X-Mailer: Reno360-SMTP`,
        `X-Priority: 3`,
      ];
      
      if (from && from !== displayFrom) {
        headers.push(`Reply-To: ${from}`);
      }
      
      const emailBody = [
        "",
        `--${boundary}`,
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        "",
        textContent,
        "",
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        "",
        html,
        "",
        `--${boundary}--`,
        "."
      ];
      
      const emailContent = [...headers, ...emailBody].join("\r\n");
      await conn.write(encoder.encode(emailContent + "\r\n"));
      const finalResponse = await readResponse();

      if (!finalResponse.startsWith("250")) {
        console.error("Message rejected by server:", finalResponse);
        return new Response(
          JSON.stringify({ error: `Le message a été refusé: ${finalResponse}` }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      await sendCommand("QUIT");
      
      console.log("=== EMAIL SENT SUCCESSFULLY ===");
      console.log("To:", to);

      return new Response(JSON.stringify({ success: true, message: "Email envoyé avec succès." }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } finally {
      try {
        conn.close();
      } catch (e) {
        // Connection may already be closed
      }
    }

  } catch (error: any) {
    console.error("Email function error:", error.stack || error.message);
    return new Response(
      JSON.stringify({ error: `Erreur lors de l'envoi: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
});
