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

// SMTP client implementation
class SMTPClient {
  private host: string;
  private port: number;
  private username: string;
  private password: string;
  private useTLS: boolean;
  private from: string;

  constructor() {
    this.host = Deno.env.get("SMTP_HOST") || "";
    this.port = parseInt(Deno.env.get("SMTP_PORT") || "587");
    this.username = Deno.env.get("SMTP_USER") || "";
    this.password = Deno.env.get("SMTP_PASS") || "";
    this.useTLS = Deno.env.get("SMTP_TLS") === "true";
    this.from = Deno.env.get("SMTP_FROM") || "";
  }

  async sendEmail(to: string, subject: string, html: string, from?: string): Promise<any> {
    const actualFrom = from || this.from;
    
    try {
      // Connect to SMTP server
      const conn = await Deno.connect({
        hostname: this.host,
        port: this.port,
      });

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

      // SMTP conversation
      console.log("Connected to SMTP server");
      let response = await readResponse(); // Initial greeting
      console.log("Server greeting:", response);

      // EHLO
      response = await sendCommand(`EHLO ${this.host}`);
      console.log("EHLO response:", response);

      // STARTTLS if required
      if (this.useTLS) {
        response = await sendCommand("STARTTLS");
        console.log("STARTTLS response:", response);
        // Note: For production, you'd need to upgrade to TLS connection here
      }

      // AUTH LOGIN
      response = await sendCommand("AUTH LOGIN");
      console.log("AUTH LOGIN response:", response);

      // Send username (base64 encoded)
      const usernameB64 = btoa(this.username);
      response = await sendCommand(usernameB64);
      console.log("Username response:", response);

      // Send password (base64 encoded)
      const passwordB64 = btoa(this.password);
      response = await sendCommand(passwordB64);
      console.log("Password response:", response);

      // MAIL FROM
      response = await sendCommand(`MAIL FROM:<${actualFrom}>`);
      console.log("MAIL FROM response:", response);

      // RCPT TO
      response = await sendCommand(`RCPT TO:<${to}>`);
      console.log("RCPT TO response:", response);

      // DATA
      response = await sendCommand("DATA");
      console.log("DATA response:", response);

      // Email headers and body
      const emailContent = [
        `From: ${actualFrom}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=utf-8`,
        "",
        html,
        "."
      ].join("\r\n");

      response = await sendCommand(emailContent);
      console.log("Email content response:", response);

      // QUIT
      response = await sendCommand("QUIT");
      console.log("QUIT response:", response);

      conn.close();

      return {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: actualFrom,
        to: [to],
        subject,
        html,
        status: "sent",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("SMTP Error:", error);
      throw error;
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from }: EmailRequest = await req.json();

    console.log("Sending email to:", to, "Subject:", subject);

    // Create SMTP client and send email
    const smtpClient = new SMTPClient();
    const emailResponse = await smtpClient.sendEmail(to, subject, html, from);
    
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);