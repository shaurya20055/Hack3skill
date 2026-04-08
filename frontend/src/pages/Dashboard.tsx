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
<<<<<<< HEAD
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
=======

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
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
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
