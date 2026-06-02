export interface GatekeeperSession {
  id: string;
  session_name: string;
  started_at: string;
  ended_at?: string;
  created_by?: string;
  is_active: boolean;
  visitor_count: number;
}

export interface GatekeeperVisitor {
  id: string;
  name: string;
  phone: string;
  company?: string;
  purpose?: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GatekeeperVisitorLog {
  id: string;
  session_id: string;
  visitor_id: string;
  check_in_time: string;
  check_out_time?: string;
  badge_number?: string;
  status: 'checked_in' | 'checked_out';
  created_at: string;
  visitor?: GatekeeperVisitor;
}

export interface VisitorFormData {
  name: string;
  phone: string;
  company?: string;
  purpose?: string;
  notes?: string;
}