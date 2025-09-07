import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = (await req.json()) as EmailRequest;

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
      console.error("Erreur de base de données:", configError);
      throw new Error(`Impossible de récupérer la configuration SMTP: ${configError.message}`);
    }
    
    if (!config) {
        throw new Error("Aucune configuration SMTP n'a été trouvée dans la table 'smtp_config'.");
    }

    const smtpConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      from: config.from_address,
      useTLS: config.use_tls
    };
    
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.from) {
        throw new Error("La configuration SMTP est incomplète. Veuillez vérifier les données dans la table 'smtp_config'.");
    }

    console.log("Configuration SMTP chargée. Tentative de connexion...");

    let conn;
    try {
      conn = await Deno.connect({
        hostname: smtpConfig.host,
        port: smtpConfig.port,
      });
    } catch (error) {
      console.error("Échec de la connexion au serveur SMTP:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP ${smtpConfig.host}:${smtpConfig.port}`);
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
        throw new Error(`Authentification SMTP échouée: ${authResponse}`);
      }
      
      // *** CORRECTIF APPLIQUÉ ICI ***
      // L'expéditeur de l'enveloppe SMTP (MAIL FROM) doit être l'utilisateur authentifié (username).
      // C'est ce qui résout l'erreur "550 Sender denied".
      const envelopeSender = smtpConfig.username;
      
      // L'adresse "From" visible par le destinataire reste celle configurée (from_address).
      const displayFrom = smtpConfig.from;

      const mailFromResponse = await sendCommand(`MAIL FROM:<${envelopeSender}>`);
      if (!mailFromResponse.startsWith("250")) {
        throw new Error(`MAIL FROM a été rejeté: ${mailFromResponse}`);
      }

      const rcptToResponse = await sendCommand(`RCPT TO:<${to}>`);
      if (!rcptToResponse.startsWith("250")) {
        throw new Error(`RCPT TO a été rejeté: ${rcptToResponse}`);
      }

      const dataResponse = await sendCommand("DATA");
      if (!dataResponse.startsWith("354")) {
          throw new Error(`La commande DATA a été rejetée: ${dataResponse}`);
      }
      
      const headers = [
        `From: Reno360 <${displayFrom}>`, // On utilise l'adresse d'affichage ici
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        `Date: ${new Date().toUTCString()}`,
      ];
      if (from && from !== displayFrom) {
        headers.push(`Reply-To: ${from}`);
      }
      headers.push("", html, ".");
      
      const emailContent = headers.join("\r\n");
      // La dernière commande envoyée est le contenu de l'email, sa réponse est lue ensuite
      await conn.write(encoder.encode(emailContent + "\r\n"));
      const finalResponse = await readResponse();

      if (!finalResponse.startsWith("250")) {
        throw new Error(`Le message a été rejeté par le serveur: ${finalResponse}`);
      }
      
      await sendCommand("QUIT");
      
      console.log("Email envoyé avec succès à:", to);

      return new Response(JSON.stringify({ success: true, message: "Email envoyé avec succès." }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } finally {
      conn.close();
    }

  } catch (error: any) {
    console.error("Erreur générale dans la fonction :", error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

