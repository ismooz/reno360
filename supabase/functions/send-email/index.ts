import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "https://deno.land/std@0.190.0/io/buffer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface pour la requête d'envoi d'email
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

  let supabaseClient;

  try {
    // Initialisation du client Supabase avec authentification via la clé de service
    // C'est la méthode recommandée pour les Edge Functions
    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );
  } catch (e) {
    console.error("Erreur initialisation Supabase:", e);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur: initialisation Supabase" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { to, subject, html, from } = await req.json() as EmailRequest;
    
    // 1. Récupérer la configuration SMTP depuis la base de données
    const { data: smtpConfig, error: dbError } = await supabaseClient
      .from('smtp_config')
      .select('host, port, username, password, from_address, use_tls')
      .eq('id', 1)
      .single();

    if (dbError) {
      console.error("Erreur DB:", dbError);
      throw new Error(`Configuration SMTP introuvable: ${dbError.message}`);
    }

    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.from_address) {
      throw new Error("Configuration SMTP incomplète dans la base de données.");
    }
    
    // 2. Connexion au serveur SMTP
    let conn;
    try {
      conn = await Deno.connect({
        hostname: smtpConfig.host,
        port: smtpConfig.port,
      });
    } catch (error) {
      console.error("Erreur de connexion SMTP:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP ${smtpConfig.host}:${smtpConfig.port}`);
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(1024);
      const n = await conn.read(buf);
      return decoder.decode(buf.subarray(0, n ?? 0));
    };

    const sendCommand = async (command: string): Promise<string> => {
      await conn.write(encoder.encode(command + "\r\n"));
      const response = await readResponse();
      console.log(`C: ${command.substring(0, 50)}... -> S: ${response.substring(0, 50).trim()}...`);
      return response;
    };
    
    try {
      // Attendre la réponse initiale du serveur
      let response = await readResponse();
      console.log(`S: ${response.trim()}`);
      
      response = await sendCommand(`EHLO ${smtpConfig.host}`);

      if (smtpConfig.use_tls) {
        response = await sendCommand("STARTTLS");
        if (response.startsWith("220")) {
          // @ts-ignore: Deno.startTls est une API Deno spécifique
          conn = await Deno.startTls(conn, { hostname: smtpConfig.host });
          await sendCommand(`EHLO ${smtpConfig.host}`); // Re-EHLO après TLS
        } else {
          throw new Error("Le serveur n'a pas accepté STARTTLS.");
        }
      }

      // 3. Authentification (plus robuste)
      response = await sendCommand("AUTH LOGIN");
      if (!response.startsWith("334")) throw new Error(`AUTH LOGIN a échoué: ${response}`);

      // CORRECTION: Utilisation de Buffer pour un encodage Base64 plus fiable
      const usernameB64 = Buffer.from(smtpConfig.username).toString("base64");
      response = await sendCommand(usernameB64);
      if (!response.startsWith("334")) throw new Error(`Nom d'utilisateur rejeté: ${response}`);

      const passwordB64 = Buffer.from(smtpConfig.password).toString("base64");
      response = await sendCommand(passwordB64);
      if (!response.startsWith("235")) throw new Error(`Mot de passe rejeté: ${response}`);
      
      // 4. Envoi de l'email
      await sendCommand(`MAIL FROM:<${smtpConfig.from_address}>`);
      await sendCommand(`RCPT TO:<${to}>`);
      
      response = await sendCommand("DATA");
      if (!response.startsWith("354")) throw new Error(`Commande DATA rejetée: ${response}`);
      
      const emailContent = [
        `From: Reno360 <${smtpConfig.from_address}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Date: ${new Date().toUTCString()}`,
        from ? `Reply-To: ${from}` : "",
        "",
        html,
        ".", // Fin du contenu de l'email
      ].filter(line => line !== "").join("\r\n");

      response = await sendCommand(emailContent);
      if (!response.startsWith("250")) throw new Error(`Message rejeté par le serveur: ${response}`);

      await sendCommand("QUIT");
      
      return new Response(JSON.stringify({ message: "Email envoyé avec succès" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } finally {
      conn.close();
    }

  } catch (error) {
    console.error("Erreur dans la fonction send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

