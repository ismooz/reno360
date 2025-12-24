import { supabase } from "@/integrations/supabase/client";

// Service de gestion des emails
export class EmailService {
  static getRequestsEmail(): string {
    return localStorage.getItem("requestsEmail") || "demandes@reno360.ch";
  }

  private static getFromEmail(): string {
    return localStorage.getItem("fromEmail") || "noreply@reno360.ch";
  }

  static async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      console.log("Envoi d'email via Edge Function...");
      console.log("To:", to);
      console.log("Subject:", subject);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html,
          from: this.getFromEmail()
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
      const requestsEmail = this.getRequestsEmail();
      
      // Préparer la section des pièces jointes
      let attachmentsSection = '';
      if (requestData.attachments && requestData.attachments.length > 0) {
        const attachmentsList = requestData.attachments
          .map((attachment: string, index: number) => {
            const fileName = requestData.attachment_metadata?.[index]?.displayName || 
                           requestData.attachment_metadata?.[index]?.originalName || 
                           `Pièce jointe ${index + 1}`;
            return `<li><a href="${attachment}" target="_blank">${fileName}</a></li>`;
          })
          .join('');
        
        attachmentsSection = `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📎 Pièces jointes :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${attachmentsList}
            </ul>
          </div>
        `;
      }

      const requestId = requestData.id ? `REQ-${requestData.id.slice(-8).toUpperCase()}` : `REQ-${Date.now().toString(36).toUpperCase()}`;

      // Email de confirmation au client
      const clientEmailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Reno360</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937;">Bonjour ${requestData.name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Nous avons bien reçu votre demande de devis et nous vous en remercions !
            </p>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>Numéro de référence :</strong> ${requestId}</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Récapitulatif de votre demande :</h3>
              <p><strong>Type de travaux :</strong> ${requestData.renovationType || requestData.renovation_type || 'Non spécifié'}</p>
              <p><strong>Code postal :</strong> ${requestData.postalCode || requestData.postal_code || 'Non spécifié'}</p>
              <p><strong>Délai souhaité :</strong> ${requestData.deadline || 'Non spécifié'}</p>
              <p><strong>Budget :</strong> ${requestData.budget || 'Non spécifié'}</p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Notre équipe analysera votre demande et vous contactera dans les plus brefs délais pour discuter de votre projet.
            </p>
            
            <p style="color: #4b5563;">Cordialement,<br><strong>L'équipe Reno360</strong></p>
          </div>
        </div>
      `;

      // Envoyer email de confirmation au client
      const clientEmailSent = await this.sendEmail(
        requestData.email,
        `Demande de devis reçue - ${requestId}`,
        clientEmailContent
      );

      if (!clientEmailSent) {
        console.warn("Échec de l'envoi de l'email de confirmation au client");
      }

      // Email à l'équipe pour nouvelle demande
      const teamEmailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #1f2937;">🔔 Nouvelle demande de devis reçue</h2>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">📋 Numéro de demande :</h3>
            <p style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 0;">${requestId}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">👤 Informations client :</h3>
            <p><strong>Nom :</strong> ${requestData.name}</p>
            <p><strong>Email :</strong> ${requestData.email}</p>
            <p><strong>Téléphone :</strong> ${requestData.phone || 'Non renseigné'}</p>
            <p><strong>Code postal :</strong> ${requestData.postalCode || requestData.postal_code || 'Non renseigné'}</p>
            <p><strong>Adresse :</strong> ${requestData.address || 'Non renseignée'}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">🏠 Détails du projet :</h3>
            <p><strong>Type de rénovation :</strong> ${requestData.renovationType || requestData.renovation_type || 'Non spécifié'}</p>
            <p><strong>Type de bâtiment :</strong> ${requestData.buildingType || requestData.building_type || 'Non spécifié'}</p>
            <p><strong>Surface :</strong> ${requestData.surfaceType || requestData.surface_type || 'Non spécifié'}</p>
            <p><strong>Délai souhaité :</strong> ${requestData.deadline || 'Non spécifié'}</p>
            <p><strong>Budget :</strong> ${requestData.budget || 'Non spécifié'}</p>
            <p><strong>Matériaux :</strong> ${requestData.materialsNeeded || requestData.materials_needed || 'Non spécifié'}</p>
          </div>
          
          ${attachmentsSection}
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">📝 Description :</h3>
            <p style="white-space: pre-wrap;">${requestData.description || 'Aucune description fournie'}</p>
          </div>
        </div>
      `;

      // Envoyer email à l'équipe
      const teamEmailSent = await this.sendEmail(
        requestsEmail,
        `🔔 Nouvelle demande: ${requestData.renovationType || requestData.renovation_type || 'Rénovation'} - ${requestId}`,
        teamEmailContent
      );

      if (!teamEmailSent) {
        console.error("Échec de l'envoi de la notification à l'équipe");
        return false;
      }

      console.log("Notifications envoyées avec succès");
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi des notifications:", error);
      return false;
    }
  }
}
