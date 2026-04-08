import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAlerts } from '../hooks/useAlerts';
import { useSound } from '../hooks/useSound';
import { useAlertStore } from '../store';
import type { AlertData } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Filter, Megaphone, Radio,
  AlertCircle, BarChart3, Shield, Sparkles
} from 'lucide-react';

// Components
import { SystemStatusBar } from '../components/SystemStatusBar';
import { AlertCard } from '../components/AlertCard';
import { MapView } from '../components/MapView';
import { BroadcastBanner } from '../components/BroadcastBanner';
import { IncidentDetail } from '../components/IncidentDetail';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { AIChat } from '../components/AIChat';

const WS_URL = 'ws://127.0.0.1:8000/ws/alerts/';
const API = 'http://127.0.0.1:8000/api';

type RightPanelTab = 'detail' | 'analytics' | 'ai';

export const Dashboard = () => {
  const {
    alerts, addAlert, removeAlert, updateAlert, setAlerts,
    addChatMessage, chatMessages, broadcasts, addBroadcast, clearBroadcast,
    token, logout
  } = useAlertStore();

  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [rightTab, setRightTab] = useState<RightPanelTab>('detail');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { play: playSound } = useSound();

  const {
    filteredAlerts, severityFilter, setSeverityFilter,
    typeFilter, setTypeFilter, searchQuery, setSearchQuery,
    criticalCount,
  } = useAlerts(alerts);

  // Fetch initial data
  useEffect(() => {
    fetch(`${API}/alerts/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data.filter((a: AlertData) => a.status !== 'resolved'));
        }
      })
      .catch(console.error);

    fetch(`${API}/staff/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStaffList(data);
      })
      .catch(() => {});
  }, [setAlerts, token]);

  // WebSocket
  const { sendJsonMessage, isConnected } = useWebSocket(WS_URL, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_alert') {
        addAlert(data.alert);
        playSound(data.alert.severity === 'critical' ? 'critical' : 'warning');
      }
      if (data.type === 'chat_message') addChatMessage(data.message);
      if (data.type === 'system_broadcast') {
        addBroadcast({ message: data.message, severity: data.severity, timestamp: new Date().toISOString() });
        playSound('critical');
      }
      if (data.type === 'status_update') updateAlert(data.alert.id, data.alert);
    },
    shouldReconnect: () => true,
  });

  const updateAlertStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API}/alerts/${id}/update_status/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        sendJsonMessage({ type: 'status_update', alert_id: id, status: newStatus });
      }
    } catch (err) { console.error(err); }
  };

  const assignStaff = async (alertId: number, staffId: number) => {
    try {
      const res = await fetch(`${API}/alerts/${alertId}/assign_staff/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId }),
      });
      const data = await res.json();
      if (res.ok) {
        updateAlert(alertId, data);
        if (selectedAlert?.id === alertId) setSelectedAlert({ ...selectedAlert, ...data });
      }
    } catch (err) { console.error(err); }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setAnalytics(await res.json());
    } catch (err) { console.error(err); }
    finally { setAnalyticsLoading(false); }
  };

  const sendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    sendJsonMessage({ type: 'broadcast_alert', message: broadcastInput, severity: 'critical' });
    setBroadcastInput('');
    setShowBroadcastModal(false);
  };

  const sendChatMsg = () => {
    if (!chatInput.trim() || !selectedAlert) return;
    sendJsonMessage({
      type: 'chat_message', alert_id: selectedAlert.id,
      message: chatInput, sender_role: 'staff', sender_name: 'Dispatch',
    });
    setChatInput('');
  };

  const seedData = async () => {
    try {
      await fetch(`${API}/seed/`, { method: 'POST' });
      const res = await fetch(`${API}/alerts/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data.filter((a: AlertData) => a.status !== 'resolved'));
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="command-grid relative">
      {/* ═══ Broadcast Banners ═══ */}
      {broadcasts.map((b, i) => (
        <BroadcastBanner
          key={i}
          message={b.message}
          severity={b.severity}
          onDismiss={() => clearBroadcast(i)}
        />
      ))}

      {/* ═══ Top: System Status Bar ═══ */}
      <SystemStatusBar
        activeAlerts={alerts.length}
        criticalCount={criticalCount}
        avgResponseTime={null}
        isConnected={isConnected}
      />

      {/* ═══ LEFT PANEL — Incidents List ═══ */}
      <div className="glass-panel border-r border-white/[0.04] flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`live-dot ${alerts.length > 0 ? 'live-dot-critical' : 'live-dot-safe'}`} />
              <span className="text-[10px] text-[#8892b0] uppercase tracking-[0.15em] font-mono font-semibold">
                {alerts.length} Active Incident{alerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[10px] text-[#4a5577] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04] cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a5577]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2 pl-9 pr-3 text-[11px] focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577] font-mono"
            />
          </div>

          {/* Filter bar */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-mono uppercase tracking-wider ${
                showFilters ? 'bg-[#0af0ff]/[0.06] border-[#0af0ff]/20 text-[#0af0ff]' : 'bg-white/[0.02] border-white/[0.06] text-[#8892b0] hover:text-white'
              }`}
            >
              <Filter className="w-3 h-3" /> Filters
            </button>
            {['all', 'critical', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev as any)}
                className={`text-[9px] px-2 py-1.5 rounded-lg border transition-all cursor-pointer uppercase tracking-wider font-mono ${
                  severityFilter === sev
                    ? sev === 'critical' ? 'bg-[#ff2d55]/10 border-[#ff2d55]/20 text-[#ff2d55]'
                    : sev === 'medium' ? 'bg-[#ff9500]/10 border-[#ff9500]/20 text-[#ff9500]'
                    : sev === 'low' ? 'bg-[#30d158]/10 border-[#30d158]/20 text-[#30d158]'
                    : 'bg-[#0af0ff]/[0.06] border-[#0af0ff]/20 text-[#0af0ff]'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#4a5577] hover:text-[#8892b0]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Type filter (collapsible) */}
          {showFilters && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-float-up">
              {['all', 'fire', 'medical', 'security', 'natural_disaster', 'other'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[9px] px-2 py-1 rounded-md border transition-all cursor-pointer capitalize font-mono ${
                    typeFilter === t
                      ? 'bg-[#bf5af2]/10 border-[#bf5af2]/20 text-[#bf5af2]'
                      : 'bg-white/[0.02] border-white/[0.06] text-[#4a5577] hover:text-[#8892b0]'
                  }`}
                >
                  {t === 'natural_disaster' ? 'disaster' : t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-3 flex gap-2 flex-shrink-0 border-b border-white/[0.04]">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] btn-critical text-white rounded-xl btn-command font-mono uppercase tracking-wider"
          >
            <Megaphone className="w-3 h-3" /> Broadcast
          </button>
          <button
            onClick={seedData}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] bg-white/[0.03] border border-white/[0.06] text-[#8892b0] hover:text-white rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider"
          >
            <Radio className="w-3 h-3" /> Seed
          </button>
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#4a5577]">
              <Shield className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-[11px] font-mono font-medium">All Clear</p>
              <p className="text-[10px] mt-1 font-mono">No active incidents</p>
            </div>
          ) : (
            filteredAlerts.map((alert, i) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert?.id === alert.id}
                onClick={() => {
                  setSelectedAlert(alert);
                  setRightTab('detail');
                }}
                index={i}
              />
            ))
          )}
        </div>
      </div>

      {/* ═══ CENTER — Map ═══ */}
      <div className="relative overflow-hidden">
        <MapView
          alerts={alerts}
          selectedAlert={selectedAlert}
          onAlertSelect={(a) => { setSelectedAlert(a); setRightTab('detail'); }}
        />

        {/* Floating tab switcher over map */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 glass-panel rounded-2xl p-1 flex gap-1">
          {([
            { id: 'detail' as RightPanelTab, icon: AlertCircle, label: 'Details' },
            { id: 'analytics' as RightPanelTab, icon: BarChart3, label: 'Analytics' },
            { id: 'ai' as RightPanelTab, icon: Sparkles, label: 'AI' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRightTab(tab.id);
                if (tab.id === 'analytics' && !analytics) loadAnalytics();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                rightTab === tab.id
                  ? 'bg-white/[0.08] text-[#0af0ff] shadow-[0_0_15px_rgba(10,240,255,0.1)]'
                  : 'text-[#8892b0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Context ═══ */}
      <div className="glass-panel border-l border-white/[0.04] overflow-hidden flex flex-col">
        {rightTab === 'detail' && selectedAlert ? (
          <IncidentDetail
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onStatusChange={updateAlertStatus}
            onAssignStaff={assignStaff}
            staffList={staffList}
            chatMessages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendChat={sendChatMsg}
          />
        ) : rightTab === 'analytics' ? (
          <AnalyticsPanel
            analytics={analytics}
            loading={analyticsLoading}
            onRefresh={loadAnalytics}
          />
        ) : rightTab === 'ai' ? (
          <AIChat context="Staff dispatch dashboard — command center" floating={false} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#4a5577] px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0af0ff]/5 to-[#bf5af2]/5 border border-white/[0.04] flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium text-[#8892b0] text-center">Select an incident</p>
            <p className="text-[11px] text-[#4a5577] mt-1 text-center font-mono">
              Click an alert to view details
            </p>
          </div>
        )}
      </div>

      {/* ═══ Broadcast Modal ═══ */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 float-panel animate-float-up border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff2d55]/15 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-[#ff2d55]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Emergency Broadcast</h3>
                <p className="text-[10px] text-[#4a5577] font-mono uppercase tracking-wider">
                  All connected users will receive this
                </p>
              </div>
            </div>

            <textarea
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              placeholder="EVACUATION NOTICE: Proceed to the nearest exit immediately."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-[#4a5577] resize-none mb-4 font-mono"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-2.5 text-sm text-[#8892b0] hover:text-white glass-card rounded-xl transition-all cursor-pointer font-mono"
              >
                Cancel
              </button>
              <button
                onClick={sendBroadcast}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 btn-critical text-white font-bold rounded-xl btn-command"
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
