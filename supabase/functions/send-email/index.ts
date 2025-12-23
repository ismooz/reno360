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
  // NOTE: smtpConfig with password is no longer accepted from client for security
  // All SMTP credentials must be configured via Supabase secrets
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = (await req.json()) as EmailRequest;

    // SECURITY: SMTP credentials are ONLY loaded from Supabase secrets
    // Client-provided passwords are no longer accepted
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

    // Database fallback for non-sensitive settings only (host, port, username, from, tls)
    // Password MUST come from Supabase secrets
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
            // SECURITY: Password ONLY from Supabase secrets, never from database
            password: smtpConfig.password,
            from: smtpConfig.from || config.from_address || "",
            useTLS: smtpConfig.useTLS ?? (config.use_tls ?? true),
          };
        }
      } catch (e) {
        console.warn("Error while attempting smtp_config fallback:", (e as Error).message);
      }
    }

    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.from) {
      // Log detailed error server-side only
      console.error("SMTP configuration incomplete - missing required fields");
      return new Response(
        JSON.stringify({ error: "Email service is not configured. Please contact support." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMTP configuration loaded. Attempting connection...");

    let conn;
    try {
      conn = await Deno.connect({
        hostname: smtpConfig.host,
        port: smtpConfig.port,
      });
    } catch (error) {
      // Log detailed error server-side only
      console.error("SMTP connection failed:", error);
      return new Response(
        JSON.stringify({ error: "Email delivery failed. Please try again later or contact support." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const responseText = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`S: ${responseText.trim()}`);
      return responseText;
    };

    const sendCommand = async (command: string): Promise<string> => {
      const logCommand = command.includes("AUTH LOGIN") || command.length > 50 ? command.substring(0, 50) + "..." : command;
      console.log(`C: ${logCommand}`);
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    try {
      await readResponse(); 
      await sendCommand(`EHLO ${smtpConfig.host}`);

      if (smtpConfig.useTLS) {
        const startTlsResponse = await sendCommand("STARTTLS");
        if (startTlsResponse.startsWith("220")) {
            // @ts-ignore: Deno.startTls est une API spécifique à Deno
            conn = await Deno.startTls(conn, { hostname: smtpConfig.host });
            await sendCommand(`EHLO ${smtpConfig.host}`);
        }
      }

      await sendCommand("AUTH LOGIN");
      // Encodage base64 via Deno std
      await sendCommand(base64Encode(encoder.encode(smtpConfig.username)));
      const authResponse = await sendCommand(base64Encode(encoder.encode(smtpConfig.password)));
      if (!authResponse.startsWith("235")) {
        // Log detailed error server-side only
        console.error("SMTP authentication failed:", authResponse);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please contact support." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // *** CORRECTIF APPLIQUÉ ICI ***
      // L'expéditeur de l'enveloppe SMTP (MAIL FROM) doit être l'utilisateur authentifié (username).
      // C'est ce qui résout l'erreur "550 Sender denied".
      const envelopeSender = smtpConfig.username;
      
      // L'adresse "From" visible par le destinataire reste celle configurée (from_address).
      const displayFrom = smtpConfig.from;

      const mailFromResponse = await sendCommand(`MAIL FROM:<${envelopeSender}>`);
      if (!mailFromResponse.startsWith("250")) {
        console.error("MAIL FROM rejected:", mailFromResponse);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please contact support." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const rcptToResponse = await sendCommand(`RCPT TO:<${to}>`);
      if (!rcptToResponse.startsWith("250")) {
        console.error("RCPT TO rejected:", rcptToResponse);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please contact support." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const dataResponse = await sendCommand("DATA");
      if (!dataResponse.startsWith("354")) {
        console.error("DATA command rejected:", dataResponse);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please contact support." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Créer version texte du HTML pour éviter la détection spam
      const textContent = html
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // Supprimer CSS
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // Supprimer JS
        .replace(/<[^>]*>/g, '') // Supprimer balises HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ') // Normaliser espaces
        .trim();

      // Générer ID de message unique
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
      
      // Corps du message multipart
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
      // La dernière commande envoyée est le contenu de l'email, sa réponse est lue ensuite
      await conn.write(encoder.encode(emailContent + "\r\n"));
      const finalResponse = await readResponse();

      if (!finalResponse.startsWith("250")) {
        console.error("Message rejected by server:", finalResponse);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please contact support." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      await sendCommand("QUIT");
      
      console.log("Email sent successfully to:", to);

      return new Response(JSON.stringify({ success: true, message: "Email envoyé avec succès." }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } finally {
      conn.close();
    }

  } catch (error: any) {
    // SECURITY: Log detailed error server-side, return generic message to client
    console.error("Email function error:", error.stack || error.message);
    return new Response(
      JSON.stringify({ error: "Email delivery failed. Please try again later or contact support." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
});
