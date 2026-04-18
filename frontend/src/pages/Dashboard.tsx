import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../useWebSocket';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAlertStore } from '../store';
import type { AlertData } from '../store';
import {
  AlertCircle, MapPin, Activity, Check, Shield, LogOut, Clock, X,
  Flame, HeartPulse, ShieldCheck, AlertTriangle, HelpCircle,
  BarChart3, Users, MessageCircle, Radio, Send, Megaphone, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AIChat } from '../components/AIChat';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WS_URL = 'ws://127.0.0.1:8000/ws/alerts/';
const API = 'http://127.0.0.1:8000/api';

const TYPE_ICONS: Record<string, any> = {
  fire: Flame,
  medical: HeartPulse,
  security: ShieldCheck,
  natural_disaster: AlertTriangle,
  other: HelpCircle,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fire: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  medical: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  security: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  natural_disaster: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-500/20' },
  medium: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500', border: 'border-orange-500/20' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/20' },
};

const STATUS_STEPS = ['reported', 'acknowledged', 'responding', 'resolved'];
const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  responding: 'Responding',
  resolved: 'Resolved',
};

function timeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

type TabType = 'show_issues' | 'send_help' | 'manage_staff' | 'mask_cat';

export const Dashboard = () => {
  const { alerts, addAlert, removeAlert, updateAlert, setAlerts, addChatMessage, chatMessages, broadcasts, addBroadcast, clearBroadcast, token, logout } = useAlertStore();
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('show_issues');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Fetch active alerts
    fetch(`${API}/alerts/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data.filter((a: AlertData) => a.status !== 'resolved'));
        }
      })
      .catch((err) => console.error(err));

    // Fetch staff list
    fetch(`${API}/staff/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStaffList(data);
      })
      .catch(() => {});
  }, [setAlerts, token]);

  const { sendJsonMessage } = useWebSocket(WS_URL, {
    onMessage: (messageEvent) => {
      const data = JSON.parse(messageEvent.data);
      if (data.type === 'new_alert') {
        addAlert(data.alert);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
      if (data.type === 'chat_message') {
        addChatMessage(data.message);
      }
      if (data.type === 'system_broadcast') {
        addBroadcast({ message: data.message, severity: data.severity, timestamp: new Date().toISOString() });
      }
      if (data.type === 'status_update') {
        updateAlert(data.alert.id, data.alert);
      }
    },
    shouldReconnect: () => true,
  });

  const updateAlertStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API}/alerts/${id}/update_status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        if (newStatus === 'resolved') {
          removeAlert(id);
          if (selectedAlert?.id === id) setSelectedAlert(null);
        } else {
          updateAlert(id, data);
          if (selectedAlert?.id === id) setSelectedAlert({ ...selectedAlert, ...data });
        }
        // Broadcast status change via WS
        sendJsonMessage({ type: 'status_update', alert_id: id, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const assignStaff = async (alertId: number, staffId: number) => {
    try {
      const res = await fetch(`${API}/alerts/${alertId}/assign_staff/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staff_id: staffId }),
      });
      const data = await res.json();
      if (res.ok) {
        updateAlert(alertId, data);
        if (selectedAlert?.id === alertId) setSelectedAlert({ ...selectedAlert, ...data });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const sendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    sendJsonMessage({
      type: 'broadcast_alert',
      message: broadcastInput,
      severity: 'critical',
    });
    setBroadcastInput('');
    setShowBroadcastModal(false);
  };

  const sendChatMsg = () => {
    if (!chatInput.trim() || !selectedAlert) return;
    sendJsonMessage({
      type: 'chat_message',
      alert_id: selectedAlert.id,
      message: chatInput,
      sender_role: 'staff',
      sender_name: 'Dispatch',
    });
    setChatInput('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login-select');
  };

  const seedData = async () => {
    try {
      await fetch(`${API}/seed/`, { method: 'POST' });
      // Reload alerts
      const res = await fetch(`${API}/alerts/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data.filter((a: AlertData) => a.status !== 'resolved'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f1a] overflow-hidden">

      {/* ── Broadcast Banners ── */}
      {broadcasts.map((b, i) => (
        <div key={i} className="fixed top-0 left-0 right-0 z-[60] bg-red-600/90 backdrop-blur-sm text-white px-6 py-3 text-center animate-float-up">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm">{b.message}</span>
            <button onClick={() => clearBroadcast(i)} className="ml-4 text-white/60 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      ))}

      {/* ── Sidebar ── */}
      <div className="w-[380px] bg-[#0f1420] border-r border-white/[0.06] flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05] cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs text-[#64748b] uppercase tracking-wider font-medium">
              {alerts.length} Active {alerts.length === 1 ? 'Incident' : 'Incidents'}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap border-b border-white/[0.06]">
          {([
            { id: 'show_issues' as TabType, icon: AlertCircle, label: 'Show Issues' },
            { id: 'send_help' as TabType, icon: Radio, label: 'Send Help' },
            { id: 'manage_staff' as TabType, icon: Users, label: 'Manage Staff' },
            { id: 'mask_cat' as TabType, icon: Shield, label: 'Mask / CAT' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'show_issues' && !analytics) loadAnalytics();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/[0.05]'
                  : 'text-[#64748b] hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* === Incidents Tab === */}
          {activeTab === 'show_issues' && (
            <>
              {/* Action buttons */}
              <div className="p-3 flex gap-2">
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition-all cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Broadcast
                </button>
                <button
                  onClick={seedData}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs bg-white/[0.04] border border-white/[0.08] text-[#64748b] hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" /> Seed Data
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-[#334155] px-6">
                  <Check className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">All clear</p>
                  <p className="text-xs mt-1">No active incidents</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {alerts.map((alert) => {
                    const eType = alert.emergency_type || 'other';
                    const sev = alert.severity || 'medium';
                    const sevColors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.medium;
                    const typeColors = TYPE_COLORS[eType] || TYPE_COLORS.other;
                    const TypeIcon = TYPE_ICONS[eType] || HelpCircle;
                    const isSelected = selectedAlert?.id === alert.id;
                    return (
                      <button
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                            : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${typeColors.bg} ${typeColors.border} border flex items-center justify-center`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${typeColors.text}`} />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-white block">
                                {eType.replace('_', ' ').replace(/^\w/, (c: string) => c.toUpperCase())} #{alert.id}
                              </span>
                              {alert.room_number && (
                                <span className="text-[10px] text-[#475569]">Room {alert.room_number}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[#475569]">
                            <Clock className="w-3 h-3" />
                            <span className="text-[11px]">{timeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                        {alert.details && (
                          <p className="text-xs text-[#64748b] mb-2 line-clamp-1">{alert.details}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${sevColors.bg} ${sevColors.border} ${sevColors.text} border uppercase`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sevColors.dot}`} />
                            {sev}
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#64748b] uppercase`}>
                            {alert.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* === Send Help Tab === */}
          {activeTab === 'send_help' && (
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.06] border border-indigo-500/20">
                <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-400" /> Quick Dispatch
                </h4>
                <p className="text-xs text-[#64748b] mb-4">Select an incident and assign staff for rapid response</p>
              </div>

              {alerts.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-[#334155]">
                  <Check className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No active incidents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const eType = alert.emergency_type || 'other';
                    const TypeIcon = TYPE_ICONS[eType] || HelpCircle;
                    const tc = TYPE_COLORS[eType] || TYPE_COLORS.other;
                    return (
                      <div key={alert.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${tc.bg} ${tc.border} border flex items-center justify-center`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${tc.text}`} />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-white">
                                {eType.replace('_', ' ').replace(/^\w/, (c: string) => c.toUpperCase())} #{alert.id}
                              </span>
                              {alert.room_number && <span className="text-[10px] text-[#475569] ml-2">Room {alert.room_number}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {staffList.length > 0 && (
                            <select
                              onChange={(e) => { if (e.target.value) assignStaff(alert.id, parseInt(e.target.value)); }}
                              value={alert.assigned_staff || ''}
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                            >
                              <option value="">Assign Staff...</option>
                              {staffList.map((s) => (
                                <option key={s.id} value={s.id}>{s.first_name || s.username} {s.last_name || ''}</option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={() => updateAlertStatus(alert.id, 'responding')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Dispatch
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* === Manage Staff Tab === */}
          {activeTab === 'manage_staff' && (
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/[0.06] to-pink-500/[0.06] border border-purple-500/20">
                <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Staff Management
                </h4>
                <p className="text-xs text-[#64748b]">View and manage your response team</p>
              </div>

              {staffList.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-[#334155]">
                  <Users className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No staff loaded</p>
                  <p className="text-xs mt-1 text-[#475569]">Staff data unavailable</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staffList.map((staff, i) => {
                    const assignedCount = alerts.filter((a) => a.assigned_staff === staff.id).length;
                    return (
                      <div key={staff.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                            ['bg-gradient-to-br from-indigo-500 to-purple-600', 'bg-gradient-to-br from-cyan-500 to-blue-600', 'bg-gradient-to-br from-emerald-500 to-teal-600', 'bg-gradient-to-br from-amber-500 to-orange-600', 'bg-gradient-to-br from-pink-500 to-rose-600'][i % 5]
                          }`}>
                            {(staff.first_name?.[0] || staff.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{staff.first_name || staff.username} {staff.last_name || ''}</div>
                            <div className="text-[10px] text-[#4a5577] font-mono">@{staff.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {assignedCount > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {assignedCount} assigned
                            </span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${assignedCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-[10px] text-[#64748b] font-mono">{assignedCount > 0 ? 'Active' : 'Available'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analytics section */}
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-2xl font-bold text-white">{staffList.length}</div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mt-1">Total Staff</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-2xl font-bold text-emerald-400">{staffList.filter((s) => !alerts.some((a) => a.assigned_staff === s.id)).length}</div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mt-1">Available</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === Mask / CAT Tab === */}
          {activeTab === 'mask_cat' && (
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.06] to-red-500/[0.06] border border-amber-500/20">
                <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> Mask / Category Management
                </h4>
                <p className="text-xs text-[#64748b]">Categorize, tag, and mask incidents for prioritized handling</p>
              </div>

              {/* Category overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Incident Categories</h4>
                {Object.entries(TYPE_COLORS).map(([type, colors]) => {
                  const TypeIcon = TYPE_ICONS[type] || HelpCircle;
                  const count = alerts.filter((a) => (a.emergency_type || 'other') === type).length;
                  return (
                    <div key={type} className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                          <TypeIcon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm font-medium text-white capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${colors.text}`}>{count}</span>
                        <span className="text-[10px] text-[#4a5577] font-mono">active</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Severity breakdown */}
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Severity Breakdown</h4>
                <div className="flex gap-3">
                  {Object.entries(SEVERITY_COLORS).map(([key, colors]) => {
                    const count = alerts.filter((a) => (a.severity || 'medium') === key).length;
                    return (
                      <div key={key} className={`flex-1 p-3 rounded-xl ${colors.bg} border ${colors.border} text-center`}>
                        <div className={`text-xl font-bold ${colors.text}`}>{count}</div>
                        <div className="text-[10px] text-[#64748b] uppercase mt-1 capitalize">{key}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Broadcast */}
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition-all cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" /> Send System Broadcast
                </button>
              </div>

              {/* AI Assistant */}
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> AI Assistant
                </h4>
                <div className="h-[300px]">
                  <AIChat context="Staff dispatch dashboard - Mask/CAT mode" floating={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex-1 flex flex-col relative">
        {selectedAlert ? (
          <>
            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={[selectedAlert.lat || 28.61, selectedAlert.lng || 77.21]}
                zoom={14}
                key={`map-${selectedAlert.id}`}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ borderRadius: 0 }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {/* Show ALL alert markers */}
                {alerts.map((a) => (
                  <Marker
                    key={a.id}
                    position={[a.lat || 28.61, a.lng || 77.21]}
                  >
                    <Popup>
                      <strong>#{a.id}</strong> — {(a.emergency_type || 'other').replace('_', ' ')}
                      <br />Severity: {a.severity || 'unknown'} | Score: {a.threat_score}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Detail Panel */}
            <div className="bg-[#0f1420] border-t border-white/[0.06] p-6 max-h-[40vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">
                      Incident #{selectedAlert.id}
                    </h2>
                    {(() => {
                      const selType = selectedAlert.emergency_type || 'other';
                      const tc = TYPE_COLORS[selType] || TYPE_COLORS.other;
                      const TypeIcon = TYPE_ICONS[selType] || HelpCircle;
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${tc.bg} ${tc.border} ${tc.text} border capitalize`}>
                          <TypeIcon className="w-3 h-3" />
                          {selType.replace('_', ' ')}
                        </div>
                      );
                    })()}
                    {(() => {
                      const sc = SEVERITY_COLORS[selectedAlert.severity || 'medium'] || SEVERITY_COLORS.medium;
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.bg} ${sc.border} ${sc.text} border uppercase`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {selectedAlert.severity}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#64748b]">
                    {selectedAlert.room_number && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Room {selectedAlert.room_number}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {new Date(selectedAlert.timestamp).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Score: {selectedAlert.threat_score}/100
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-2 text-sm text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Details / AI suggestion */}
              {(selectedAlert.details || selectedAlert.ai_suggestion) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {selectedAlert.details && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <h4 className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-1">Details</h4>
                      <p className="text-sm text-[#94a3b8]">{selectedAlert.details}</p>
                    </div>
                  )}
                  {selectedAlert.ai_suggestion && (
                    <div className="p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20">
                      <h4 className="text-[10px] text-indigo-400 uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> AI Recommendation
                      </h4>
                      <p className="text-sm text-[#94a3b8]">{selectedAlert.ai_suggestion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Pipeline */}
              <div className="mb-4">
                <h4 className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-2">Status</h4>
                <div className="flex items-center gap-1">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(selectedAlert.status);
                    const isActive = i <= currentIdx;
                    const isCurrent = step === selectedAlert.status;
                    const isNext = i === currentIdx + 1;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-1">
                        <button
                          onClick={() => {
                            if (isNext || (step === 'resolved' && currentIdx < 3)) {
                              updateAlertStatus(selectedAlert.id, step);
                            }
                          }}
                          disabled={!isNext && step !== 'resolved'}
                          className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                              : isActive
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                              : isNext
                              ? 'bg-white/[0.04] text-[#64748b] border border-white/[0.08] hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/20'
                              : 'bg-white/[0.02] text-[#334155] border border-white/[0.04]'
                          }`}
                        >
                          {STATUS_LABELS[step]}
                        </button>
                        {i < STATUS_STEPS.length - 1 && (
                          <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-[#1e293b]'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assign Staff + Quick Actions */}
              <div className="flex items-center gap-3">
                {staffList.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) assignStaff(selectedAlert.id, parseInt(e.target.value));
                    }}
                    value={selectedAlert.assigned_staff || ''}
                    className="bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="">Assign Staff...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name || s.username} {s.last_name || ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Resolve
                </button>
              </div>

              {/* Chat */}
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <h4 className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Live Chat
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1.5 mb-2">
                  {chatMessages
                    .filter((m) => m.alert_id === selectedAlert.id)
                    .map((m, i) => (
                      <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${m.sender_role === 'staff' ? 'bg-indigo-500/10 text-indigo-300 ml-8' : 'bg-white/[0.04] text-[#94a3b8] mr-8'}`}>
                        <span className="font-semibold">{m.sender_name}:</span> {m.message}
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMsg()}
                    placeholder="Message to guest..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 placeholder:text-[#334155]"
                  />
                  <button onClick={sendChatMsg} className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#1e293b]">
            <Shield className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-lg font-medium text-[#334155]">Select an incident to view details</p>
            <p className="text-sm text-[#1e293b] mt-1">Alerts will appear in real-time on the left panel</p>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f1420] border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-float-up">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">System Broadcast</h3>
            </div>
            <p className="text-xs text-[#64748b] mb-4">This message will be sent to ALL connected guests and staff.</p>
            <textarea
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              placeholder="e.g., EVACUATION NOTICE: Please proceed to the nearest exit immediately."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all placeholder:text-[#334155] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-2.5 text-sm text-[#64748b] hover:text-white border border-white/[0.08] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={sendBroadcast}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Megaphone className="w-4 h-4" /> Send to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
