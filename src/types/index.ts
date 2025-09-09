
export interface AttachmentMetadata {
  filename: string; // Chemin du fichier dans le storage
  displayName: string; // Nom personnalisé donné par l'utilisateur
  type: 'image' | 'document'; // Type de fichier
  originalName: string; // Nom original du fichier
}

export interface RenovationType {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'deleted';
  requestCount?: number;
  lastRequestDate?: string;
}

export interface RenovationRequest {
  id: string;
  renovation_type: string; // Correspond à la colonne DB
  user_id?: string; // Correspond à la colonne DB
  clientId?: string; // Pour compatibilité localStorage
  renovationType?: string; // Pour compatibilité localStorage
  name: string;
  email: string;
  phone?: string;
  postal_code?: string; // Correspond à la colonne DB
  postalCode?: string; // Pour compatibilité localStorage
  address?: string;
  building_type?: string; // Correspond à la colonne DB
  buildingType?: string; // Pour compatibilité localStorage
  surface_type?: string; // Correspond à la colonne DB
  surfaceType?: string; // Pour compatibilité localStorage
  deadline?: string;
  description?: string;
  materials_needed?: string; // Correspond à la colonne DB
  materialsNeeded?: string; // Pour compatibilité localStorage
  budget?: string;
  preferred_date?: string | null; // Correspond à la colonne DB
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected';
  created_at: string; // Correspond à la colonne DB
  createdAt?: string; // Pour compatibilité localStorage
  updated_at: string; // Correspond à la colonne DB
  attachments?: string[]; // URLs des photos uploadées
  attachment_metadata?: AttachmentMetadata[] | any; // Métadonnées des fichiers avec noms personnalisés (JSON from DB)
}

export interface Project {
  id: string;
  name: string;
  year: number;
  description: string;
  images: string[];
  beforeAfterImages?: {
    before: string;
    after: string;
  };
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_creation' | 'password_change' | 'account_closure' | 'account_deletion' | 'request_status_change';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type EmailTemplate = {
  subject: string;
  body: string;
};

export type EmailTemplates = {
  account_creation: EmailTemplate;
  password_change: EmailTemplate;
  account_closure: EmailTemplate;
  account_deletion: EmailTemplate;
  request_status_change: EmailTemplate;
  client_request_received: EmailTemplate;
};

export interface EmailSettings {
  fromEmail: string;
  replyToEmail: string;
  requestsEmail: string;
  templates: EmailTemplates;
}
