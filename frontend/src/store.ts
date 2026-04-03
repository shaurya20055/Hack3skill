import { create } from 'zustand';

export interface AlertData {
  id: number;
  lat: number;
  lng: number;
  threat_score: number;
  status: string;
  timestamp: string;
  trigger_type?: string;
}

interface AlertStore {
  alerts: AlertData[];
  addAlert: (alert: AlertData) => void;
  removeAlert: (id: number) => void;
  setAlerts: (alerts: AlertData[]) => void;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, alerts: [] });
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
  setAlerts: (alerts) =>
    set(() => ({
      alerts: alerts.sort((a, b) => b.threat_score - a.threat_score),
    })),
}));
