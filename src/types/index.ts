
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
  renovationType: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  buildingType: string;
  surfaceType: string;
  deadline: string;
  description: string;
  materialsNeeded: string;
  budget?: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected';
  createdAt: string;
  attachments?: string[]; // URLs des photos uploadées
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
};

export interface EmailSettings {
  fromEmail: string;
  replyToEmail: string;
  requestsEmail: string;
  templates: EmailTemplates;
}
