import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Les en-têtes CORS restent importants pour permettre à votre interface d'appeler la fonction
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Interface pour la requête d'envoi d'email
interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string; // Optionnel, pour le "Reply-To"
}

serve(async (req: Request) => {
  // Gérer la requête préliminaire (preflight) CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = (await req.json()) as EmailRequest;

    // Étape 1: Créer un client Supabase pour accéder à la base de données.
    // Il utilise les secrets SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
    // que vous devez configurer pour cette fonction.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Étape 2: Récupérer la configuration SMTP depuis la table 'smtp_config'.
    // On sélectionne l'unique ligne de configuration avec id = 1.
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

    // Étape 3: Utiliser la configuration de la base de données.
    const smtpConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      from: config.from_address, // Attention au nom de la colonne
      useTLS: config.use_tls      // Attention au nom de la colonne
    };
    
    // Vérification que les champs essentiels sont remplis
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.from) {
        throw new Error("La configuration SMTP est incomplète. Veuillez vérifier les données dans la table 'smtp_config'.");
    }

    console.log("Configuration SMTP chargée avec succès depuis la base de données.");

    // Le reste du code pour la connexion et l'envoi SMTP reste inchangé
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
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    const sendCommand = async (command: string): Promise<string> => {
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    try {
      await readResponse(); // Attendre le message de bienvenue du serveur
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
      await sendCommand(btoa(smtpConfig.username));
      const authResponse = await sendCommand(btoa(smtpConfig.password));
      if (!authResponse.startsWith("235")) {
        throw new Error(`Authentification SMTP échouée: ${authResponse}`);
      }
      
      const envelopeFrom = smtpConfig.from;
      await sendCommand(`MAIL FROM:<${envelopeFrom}>`);
      await sendCommand(`RCPT TO:<${to}>`);
      await sendCommand("DATA");
      
      const headers = [
        `From: Reno360 <${envelopeFrom}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        `Date: ${new Date().toUTCString()}`,
      ];
      if (from && from !== envelopeFrom) {
        headers.push(`Reply-To: ${from}`);
      }
      headers.push("", html, ".");
      
      const emailContent = headers.join("\r\n");
      const finalResponse = await sendCommand(emailContent);

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
    console.error("Erreur générale dans la fonction :", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

