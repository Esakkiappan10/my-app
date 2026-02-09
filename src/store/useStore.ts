import { create } from 'zustand';
import { FollowUp, Reminder, StatusItem, Decision, EmailDraft } from '../types';

interface StoreState {
  // Data Lists
  followUps: FollowUp[];
  reminders: Reminder[];
  statusItems: StatusItem[];
  decisions: Decision[];
  emails: EmailDraft[];

  // Actions
  addFollowUp: (item: FollowUp) => void;
  completeFollowUp: (id: string) => void;
  
  addReminder: (item: Reminder) => void;
  toggleReminder: (id: string) => void;

  // New Actions
  addStatusItem: (item: StatusItem) => void;
  addDecision: (item: Decision) => void;
  addEmail: (item: EmailDraft) => void;
}

export const useStore = create<StoreState>((set) => ({
  // Initial Data
  followUps: [],
  reminders: [],
  statusItems: [
    { id: '1', title: 'Server Cluster A', status: 'operational', uptime: '99.9%', lastChecked: new Date() },
    { id: '2', title: 'Database Shard 1', status: 'performance', uptime: '98.5%', lastChecked: new Date() },
    { id: '3', title: 'API Gateway', status: 'maintenance', uptime: '100%', lastChecked: new Date() },
  ],
  decisions: [
    { id: '1', title: 'Expand to Region B', type: 'opportunity', impact: 'high', score: 85, date: new Date() },
    { id: '2', title: 'Legacy Code Migration', type: 'risk', impact: 'medium', score: 45, date: new Date() },
  ],
  emails: [],

  // Actions
  addFollowUp: (item) => set((state) => ({ followUps: [...state.followUps, item] })),
  completeFollowUp: (id) => set((state) => ({
    followUps: state.followUps.map(f => f.id === id ? { ...f, completed: !f.completed } : f)
  })),

  addReminder: (item) => set((state) => ({ reminders: [...state.reminders, item] })),
  toggleReminder: (id) => set((state) => ({
    reminders: state.reminders.map(r => r.id === id ? { ...r, active: !r.active } : r)
  })),

  addStatusItem: (item) => set((state) => ({ statusItems: [...state.statusItems, item] })),
  addDecision: (item) => set((state) => ({ decisions: [...state.decisions, item] })),
  addEmail: (item) => set((state) => ({ emails: [...state.emails, item] })),
}));