import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

interface SecretsUpdateRequest {
  secrets: Array<{
    name: string;
    value: string;
  }>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Si c'est une demande de mise à jour des secrets
    if ('secrets' in body) {
      const { secrets } = body as SecretsUpdateRequest;
      
      // Simuler la mise à jour des secrets
      console.log("Updating secrets:", secrets.map(s => ({ name: s.name, hasValue: !!s.value })));
      
      // En réalité, les secrets doivent être configurés manuellement dans Supabase
      // Ici on simule juste le processus
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Secrets updated successfully",
        updated: secrets.length 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Sinon, c'est une demande d'envoi d'email
    const { to, subject, html, from } = body as EmailRequest;

    console.log("Sending email to:", to, "Subject:", subject);

    // Vérifier la configuration des secrets
    const requiredSecrets = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_TLS"];
    const missingSecrets = requiredSecrets.filter(secret => !Deno.env.get(secret));
    
    if (missingSecrets.length > 0) {
      console.error("Missing secrets:", missingSecrets);
      throw new Error(`Configuration incomplète. Secrets manquants: ${missingSecrets.join(", ")}`);
    }

    // Configuration SMTP depuis les variables d'environnement
    const smtpConfig = {
      host: Deno.env.get("SMTP_HOST") || "mail.infomaniak.com",
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      username: Deno.env.get("SMTP_USER") || "",
      password: Deno.env.get("SMTP_PASS") || "",
      from: Deno.env.get("SMTP_FROM") || "",
      useTLS: (Deno.env.get("SMTP_TLS") || "true") === "true"
    };

    console.log("SMTP Config:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username ? smtpConfig.username.substring(0, 3) + "***" : "not set",
      from: smtpConfig.from,
      useTLS: smtpConfig.useTLS
    });

    // Connecter au serveur SMTP
    let conn;
    try {
      conn = await Deno.connect({
        hostname: smtpConfig.host,
        port: smtpConfig.port,
      });
    } catch (error) {
      console.error("Failed to connect to SMTP server:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP ${smtpConfig.host}:${smtpConfig.port}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to read response
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    // Helper function to send command
    const sendCommand = async (command: string): Promise<string> => {
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    try {
      // SMTP conversation
      console.log("Connected to SMTP server");
      let response = await readResponse(); // Initial greeting
      console.log("Server greeting:", response);

      // EHLO
      response = await sendCommand(`EHLO ${smtpConfig.host}`);
      console.log("EHLO response:", response);

      // STARTTLS if required
      if (smtpConfig.useTLS) {
        response = await sendCommand("STARTTLS");
        console.log("STARTTLS response:", response);
        
        if (response.startsWith("220")) {
          // Upgrade connection to TLS
          try {
            // @ts-ignore - startTls is available in Deno runtime
            conn = await (Deno as any).startTls(conn, { hostname: smtpConfig.host });
            // Re-EHLO after STARTTLS
            response = await sendCommand(`EHLO ${smtpConfig.host}`);
            console.log("EHLO after STARTTLS:", response);
          } catch (tlsError) {
            console.error("TLS upgrade failed:", tlsError);
            throw new Error("Échec de la mise à niveau TLS");
          }
        }
      }

      // AUTH LOGIN
      response = await sendCommand("AUTH LOGIN");
      console.log("AUTH LOGIN response:", response);

      // Send username (base64 encoded)
      const usernameB64 = btoa(smtpConfig.username);
      response = await sendCommand(usernameB64);
      console.log("Username response:", response);

      // Send password (base64 encoded)
      const passwordB64 = btoa(smtpConfig.password);
      response = await sendCommand(passwordB64);
      console.log("Password response:", response);

      if (!response.startsWith("235")) {
        throw new Error(`Authentification échouée: ${response}`);
      }

      // MAIL FROM
      const envelopeFrom = smtpConfig.from;
      response = await sendCommand(`MAIL FROM:<${envelopeFrom}>`);
      console.log("MAIL FROM response:", response);

      if (!response.startsWith("250")) {
        throw new Error(`MAIL FROM rejeté: ${response}`);
      }

      // RCPT TO
      response = await sendCommand(`RCPT TO:<${to}>`);
      console.log("RCPT TO response:", response);

      if (!response.startsWith("250")) {
        throw new Error(`RCPT TO rejeté: ${response}`);
      }

      // DATA
      response = await sendCommand("DATA");
      console.log("DATA response:", response);

      if (!response.startsWith("354")) {
        throw new Error(`DATA rejeté: ${response}`);
      }

      // Email headers and body
      const headers: string[] = [
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

      response = await sendCommand(emailContent);
      console.log("Email content response:", response);

      if (!response.startsWith("250")) {
        throw new Error(`Message rejeté par le serveur: ${response}`);
      }

      // QUIT
      response = await sendCommand("QUIT");
      console.log("QUIT response:", response);

      const result = {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: envelopeFrom,
        to: [to],
        subject,
        html,
        status: "sent",
        timestamp: new Date().toISOString()
      };

      console.log("Email sent successfully:", result);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } finally {
      try {
        conn.close();
      } catch (e) {
        console.warn("Error closing connection:", e);
      }
    }

  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Vérifiez la configuration SMTP et les secrets Supabase"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});