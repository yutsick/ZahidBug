export interface User {
  id: number;
  tender_number: string;
  company_name: string;
  edrpou: string;
  email: string;
  phone: string;
  contact_person: string;
  department: number;
  department_name: string;
  status: 'new' | 'in_progress' | 'pending' | 'accepted' | 'declined' | 'blocked';
  status_display: string;
  role: 'user' | 'admin' | 'superadmin';
  is_activated: boolean;
  created_at: string;
  updated_at: string;
  documents_folder?: string;
  legal_address?: string;
  actual_address?: string;
  director_name?: string;
  last_login?: string;
}

export interface RegistrationData {
  tender_number: string;
  department: number;
  company_name: string;
  edrpou: string;
  legal_address: string;
  actual_address: string;
  director_name: string;
  contact_person: string;
  email: string;
  phone: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ActivationData {
  token: string;
  password: string;
  password_confirm: string;
  new_username?: string;
}
