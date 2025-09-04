import { EmailSettings, EmailTemplates } from "@/types";

// Service de gestion des emails (simulation)
export class EmailService {
  private static getSettings(): EmailSettings {
    const fromEmail = localStorage.getItem("fromEmail") || "noreply@reno360.ch";
    const replyToEmail = localStorage.getItem("replyToEmail") || "contact@reno360.ch";
    const requestsEmail = localStorage.getItem("requestsEmail") || "demandes@reno360.ch";
    const templates = JSON.parse(localStorage.getItem("emailTemplates") || "{}");
    
    return {
      fromEmail,
      replyToEmail,
      requestsEmail,
      templates
    };
  }

  static async sendEmail(
    to: string,
    templateType: keyof EmailTemplates,
    variables: Record<string, string> = {}
  ): Promise<boolean> {
    try {
      const settings = this.getSettings();
      const template = settings.templates[templateType];
      
      if (!template) {
        console.error(`Template ${templateType} not found`);
        return false;
      }

      // Remplacer les variables dans le template
      let subject = template.subject;
      let body = template.body;
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });

      // Envoyer l'email via Edge Function
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: body,
          from: settings.fromEmail
        }
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return false;
      }

      console.log("Email envoyé avec succès:", data);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return false;
    }
  }

  static async sendRequestNotification(requestData: any): Promise<boolean> {
    try {
      const settings = this.getSettings();
      
      // Email à l'équipe pour nouvelle demande
      const emailContent = `
        <h2>Nouvelle demande de devis reçue</h2>
        
        <p><strong>Client:</strong> ${requestData.name}</p>
        <p><strong>Email:</strong> ${requestData.email}</p>
        <p><strong>Téléphone:</strong> ${requestData.phone}</p>
        <p><strong>Type de rénovation:</strong> ${requestData.renovationType}</p>
        <p><strong>Code postal:</strong> ${requestData.postalCode}</p>
        
        <h3>Description:</h3>
        <p>${requestData.description}</p>
        
        <p><strong>Délai souhaité:</strong> ${requestData.deadline}</p>
        <p><strong>Budget:</strong> ${requestData.budget || "Non spécifié"}</p>
      `;

      // Envoyer via Edge Function
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: settings.requestsEmail,
          subject: `Nouvelle demande: ${requestData.renovationType}`,
          html: emailContent,
          from: settings.fromEmail
        }
      });

      if (error) {
        console.error("Erreur lors de l'envoi de la notification:", error);
        return false;
      }

      console.log("Notification envoyée avec succès:", data);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
      return false;
    }
  }

  static getRequestsEmail(): string {
    return localStorage.getItem("requestsEmail") || "demandes@reno360.ch";
  }
}