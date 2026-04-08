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

type TabType = 'incidents' | 'analytics' | 'ai';

export const Dashboard = () => {
  const { alerts, addAlert, removeAlert, updateAlert, setAlerts, addChatMessage, chatMessages, broadcasts, addBroadcast, clearBroadcast, token, logout } = useAlertStore();
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
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
    navigate('/login');
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
              <h1 className="text-lg font-bold text-white">Rapid Crisis</h1>
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
        <div className="flex border-b border-white/[0.06]">
          {([
            { id: 'incidents' as TabType, icon: AlertCircle, label: 'Incidents' },
            { id: 'analytics' as TabType, icon: BarChart3, label: 'Analytics' },
            { id: 'ai' as TabType, icon: Activity, label: 'AI Assistant' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'analytics' && !analytics) loadAnalytics();
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
          {activeTab === 'incidents' && (
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

          {/* === Analytics Tab === */}
          {activeTab === 'analytics' && (
            <div className="p-4 space-y-4">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : analytics ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total', value: analytics.total_incidents, color: 'text-white' },
                      { label: 'Active', value: analytics.active_incidents, color: 'text-red-400' },
                      { label: 'Resolved', value: analytics.resolved_incidents, color: 'text-emerald-400' },
                      { label: 'Avg Response', value: analytics.avg_response_time ? `${Math.round(analytics.avg_response_time / 60)}m` : 'N/A', color: 'text-indigo-400' },
                    ].map((s, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* By Type */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">By Type</h4>
                    <div className="space-y-2">
                      {(analytics.by_type || []).map((item: any, i: number) => {
                        const tc = TYPE_COLORS[item.emergency_type] || TYPE_COLORS.other;
                        const maxCount = Math.max(...(analytics.by_type || []).map((t: any) => t.count), 1);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className={`text-xs font-medium ${tc.text} w-24 capitalize`}>
                              {(item.emergency_type || 'other').replace('_', ' ')}
                            </span>
                            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${tc.bg} transition-all`}
                                style={{ width: `${(item.count / maxCount) * 100}%`, backgroundColor: tc.text.includes('red') ? '#ef4444' : tc.text.includes('pink') ? '#ec4899' : tc.text.includes('amber') ? '#f59e0b' : tc.text.includes('purple') ? '#a855f7' : '#64748b' }}
                              />
                            </div>
                            <span className="text-xs font-bold text-white w-6 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Severity Breakdown */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Severity</h4>
                    <div className="flex gap-3">
                      {Object.entries(analytics.severity_breakdown || {}).map(([key, value]: any) => {
                        const sc = SEVERITY_COLORS[key] || SEVERITY_COLORS.medium;
                        return (
                          <div key={key} className={`flex-1 p-3 rounded-xl ${sc.bg} border ${sc.border} text-center`}>
                            <div className={`text-xl font-bold ${sc.text}`}>{value}</div>
                            <div className="text-[10px] text-[#64748b] uppercase mt-1 capitalize">{key}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Insights */}
                  {analytics.ai_insights && (
                    <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.06] border border-indigo-500/20 p-4">
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> AI Insights
                      </h4>
                      <p className="text-sm text-[#94a3b8] mb-3">{analytics.ai_insights.summary}</p>
                      {analytics.ai_insights.recommendations && (
                        <ul className="space-y-1.5">
                          {analytics.ai_insights.recommendations.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-[#64748b] flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <button
                    onClick={loadAnalytics}
                    className="w-full py-2 text-xs text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer"
                  >
                    Refresh Analytics
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-[#475569]">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">Loading analytics...</p>
                </div>
              )}
            </div>
          )}

          {/* === AI Assistant Tab === */}
          {activeTab === 'ai' && (
            <div className="h-full">
              <AIChat context="Staff dispatch dashboard" floating={false} />
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
