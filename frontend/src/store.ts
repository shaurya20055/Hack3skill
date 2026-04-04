import { create } from 'zustand';

export interface AlertData {
  id: number;
  lat: number;
  lng: number;
  threat_score: number;
  status: string;
  timestamp: string;
  trigger_type?: string;
  emergency_type: string;
  severity: string;
  details: string;
  room_number: string;
  ai_suggestion: string;
  ai_summary: string;
  assigned_staff?: number | null;
  assigned_staff_details?: { id: number; username: string; first_name: string; last_name: string } | null;
  response_time?: number | null;
}

export interface ChatMsg {
  id: number;
  alert_id: number | null;
  sender_role: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export interface SystemBroadcast {
  message: string;
  severity: string;
  timestamp: string;
}

interface AlertStore {
  alerts: AlertData[];
  addAlert: (alert: AlertData) => void;
  removeAlert: (id: number) => void;
  updateAlert: (id: number, data: Partial<AlertData>) => void;
  setAlerts: (alerts: AlertData[]) => void;
  chatMessages: ChatMsg[];
  addChatMessage: (msg: ChatMsg) => void;
  broadcasts: SystemBroadcast[];
  addBroadcast: (b: SystemBroadcast) => void;
  clearBroadcast: (index: number) => void;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  chatMessages: [],
  broadcasts: [],
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, alerts: [], chatMessages: [] });
  },

  addAlert: (alert) =>
    set((state) => {
      const exists = state.alerts.find((a) => a.id === alert.id);
      if (exists) return state;
      const newAlerts = [...state.alerts, alert].sort((a, b) => b.threat_score - a.threat_score);
      return { alerts: newAlerts };
    }),

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  updateAlert: (id, data) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),

  setAlerts: (alerts) =>
    set(() => ({
      alerts: alerts.sort((a, b) => b.threat_score - a.threat_score),
    })),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  addBroadcast: (b) =>
    set((state) => ({
      broadcasts: [...state.broadcasts, b],
    })),

  clearBroadcast: (index) =>
    set((state) => ({
      broadcasts: state.broadcasts.filter((_, i) => i !== index),
    })),
}));
