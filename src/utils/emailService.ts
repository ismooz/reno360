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

      // Dans une vraie application, ici on enverrait l'email via un service comme SendGrid, Mailgun, etc.
      console.log("Email envoyé:", {
        from: settings.fromEmail,
        to,
        replyTo: settings.replyToEmail,
        subject,
        body
      });

      // Simuler l'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        Nouvelle demande de devis reçue:
        
        Client: ${requestData.name}
        Email: ${requestData.email}
        Téléphone: ${requestData.phone}
        Type de rénovation: ${requestData.renovationType}
        Code postal: ${requestData.postalCode}
        
        Description:
        ${requestData.description}
        
        Délai souhaité: ${requestData.deadline}
        Budget: ${requestData.budget || "Non spécifié"}
      `;

      console.log("Notification envoyée à l'équipe:", {
        from: settings.fromEmail,
        to: settings.requestsEmail,
        subject: `Nouvelle demande: ${requestData.renovationType}`,
        body: emailContent
      });

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