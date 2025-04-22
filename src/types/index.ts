
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
