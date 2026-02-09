export interface FollowUp {
  id: string;
  title: string;
  description?: string;
  followUpDate: Date;
  notified: boolean;
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: Date;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  active: boolean;
}

// --- NEW TYPES BELOW ---

export interface StatusItem {
  id: string;
  title: string;
  status: 'operational' | 'performance' | 'downtime' | 'maintenance';
  uptime: string;
  lastChecked: Date;
}

export interface Decision {
  id: string;
  title: string;
  type: 'risk' | 'opportunity' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  score: number; // 0-100
  date: Date;
}

export interface EmailDraft {
  id: string;
  subject: string;
  recipient: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledDate?: Date;
}