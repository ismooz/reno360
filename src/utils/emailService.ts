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

      // Récupérer la configuration SMTP depuis localStorage
      const smtpConfig = this.getSMTPConfig();

      // Envoyer l'email via Edge Function avec la config SMTP
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: body,
          from: settings.fromEmail,
          smtpConfig
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

  private static getSMTPConfig() {
    const smtpHost = localStorage.getItem("smtpHost") || "";
    const smtpPort = localStorage.getItem("smtpPort") || "587";
    const smtpUser = localStorage.getItem("smtpUser") || "";
    // NOTE: Password is NOT read from localStorage for security reasons
    // The Edge Function should use SMTP_PASS from Supabase secrets
    const smtpFrom = localStorage.getItem("smtpFrom") || "";
    const smtpTls = localStorage.getItem("smtpTls") !== "false";

    return {
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      username: smtpUser,
      // Password omitted - Edge Function will use SMTP_PASS secret
      from: smtpFrom,
      useTLS: smtpTls
    };
  }

  static async sendRequestNotification(requestData: any): Promise<boolean> {
    try {
      // Préparer la section des pièces jointes
      let attachmentsSection = '';
      if (requestData.attachments && requestData.attachments.length > 0) {
        const attachmentsList = requestData.attachments
          .map((attachment: string, index: number) => {
            const fileName = requestData.attachment_metadata?.[index]?.displayName || 
                           requestData.attachment_metadata?.[index]?.originalName || 
                           `Pièce jointe ${index + 1}`;
            return `<li>${fileName}</li>`;
          })
          .join('');
        
        attachmentsSection = `
          <div style="margin-top: 15px;">
            <p><strong>📎 Pièces jointes reçues :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${attachmentsList}
            </ul>
          </div>
        `;
      }

      // Envoyer email de confirmation au client
      const clientEmailSent = await this.sendEmail(
        requestData.email,
        'client_request_received',
        {
          name: requestData.name,
          renovationType: requestData.renovationType || requestData.renovation_type,
          postalCode: requestData.postalCode || requestData.postal_code || '',
          deadline: requestData.deadline || '',
          budget: requestData.budget || 'Non spécifié',
          requestId: requestData.id ? `REQ-${requestData.id.slice(-8).toUpperCase()}` : 'Numéro en cours d\'attribution',
          attachmentsSection
        }
      );

      if (!clientEmailSent) {
        console.warn("Échec de l'envoi de l'email de confirmation au client");
      }

      const settings = this.getSettings();
      
      // Préparer la section des pièces jointes pour l'équipe
      let teamAttachmentsSection = '';
      if (requestData.attachments && requestData.attachments.length > 0) {
        const attachmentsList = requestData.attachments
          .map((attachment: string, index: number) => {
            const fileName = requestData.attachment_metadata?.[index]?.displayName || 
                           requestData.attachment_metadata?.[index]?.originalName || 
                           `Pièce jointe ${index + 1}`;
            return `<li><a href="${attachment}" target="_blank">${fileName}</a></li>`;
          })
          .join('');
        
        teamAttachmentsSection = `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📎 Pièces jointes :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${attachmentsList}
            </ul>
          </div>
        `;
      }
      
      // Email à l'équipe pour nouvelle demande
      const emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #1f2937;">Nouvelle demande de devis reçue</h2>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📋 Numéro de demande :</h3>
            <p style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 0;">${requestData.id ? `REQ-${requestData.id.slice(-8).toUpperCase()}` : 'ID en cours d\'attribution'}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Informations client :</h3>
            <p><strong>Client:</strong> ${requestData.name}</p>
            <p><strong>Email:</strong> ${requestData.email}</p>
            <p><strong>Téléphone:</strong> ${requestData.phone}</p>
            <p><strong>Code postal:</strong> ${requestData.postalCode}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Détails du projet :</h3>
            <p><strong>Type de rénovation:</strong> ${requestData.renovationType || requestData.renovation_type}</p>
            <p><strong>Délai souhaité:</strong> ${requestData.deadline}</p>
            <p><strong>Budget:</strong> ${requestData.budget || "Non spécifié"}</p>
          </div>
          
          ${teamAttachmentsSection}
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Description :</h3>
            <p>${requestData.description}</p>
          </div>
        </div>
      `;

      // Récupérer la configuration SMTP depuis localStorage
      const smtpConfig = this.getSMTPConfig();

      // Envoyer via Edge Function avec la config SMTP
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: settings.requestsEmail,
          subject: `Nouvelle demande: ${requestData.renovationType || requestData.renovation_type} (${requestData.id ? `REQ-${requestData.id.slice(-8).toUpperCase()}` : 'ID en attente'})`,
          html: emailContent,
          from: settings.fromEmail,
          smtpConfig
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