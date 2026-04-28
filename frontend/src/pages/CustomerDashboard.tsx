import { useEffect, useState, useRef } from 'react';
import { useAlertStore } from '../store';
import type { AlertData } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Clock, History, MapPin,
  Shield, LogOut, Send, ChevronRight, CheckCircle2,
  Flame, HeartPulse, ShieldCheck, Droplets, ClipboardList,
  Plus, Eye, Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import { API } from '../config';

const EMERGENCY_TYPES = [
  { id: 'fire', label: 'Fire', icon: Flame, color: '#ff2d55', inactive: 'bg-[#ff2d55]/[0.08] border-[#ff2d55]/15 text-[#ff2d55]', active: 'from-[#ff2d55] to-[#d91e48]' },
  { id: 'flood', label: 'Flood', icon: Droplets, color: '#0ea5e9', inactive: 'bg-[#0ea5e9]/[0.08] border-[#0ea5e9]/15 text-[#0ea5e9]', active: 'from-[#0ea5e9] to-[#0284c7]' },
  { id: 'medical', label: 'Medical', icon: HeartPulse, color: '#ff6b9d', inactive: 'bg-[#ff6b9d]/[0.08] border-[#ff6b9d]/15 text-[#ff6b9d]', active: 'from-[#ff6b9d] to-[#ff2d7a]' },
  { id: 'security', label: 'Security', icon: ShieldCheck, color: '#ff9500', inactive: 'bg-[#ff9500]/[0.08] border-[#ff9500]/15 text-[#ff9500]', active: 'from-[#ff9500] to-[#e08600]' },
  { id: 'routine', label: 'Routine', icon: ClipboardList, color: '#8892b0', inactive: 'bg-[#8892b0]/[0.08] border-[#8892b0]/15 text-[#8892b0]', active: 'from-[#8892b0] to-[#6a7394]' },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const STATUS_STEPS = ['reported', 'acknowledged', 'responding', 'resolved'];
const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  responding: 'Responding',
  resolved: 'Resolved',
};

type CustomerTab = 'raise' | 'status' | 'history';

function timeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export const CustomerDashboard = () => {
  const { token, logout } = useAlertStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CustomerTab>('raise');
  const [allIssues, setAllIssues] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Raise Issue form state
  const [emergencyType, setEmergencyType] = useState('routine');
  const [details, setDetails] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [aiSuggestion, setAiSuggestion] = useState<{ type: string; confidence: number } | null>(null);
  const [classifyTimeout, setClassifyTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [token]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/alerts/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllIssues(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Smart detection: auto-classify text as user types
  const handleDetailsChange = (text: string) => {
    setDetails(text);
    if (classifyTimeout) clearTimeout(classifyTimeout);
    if (text.trim().length < 10) {
      setAiSuggestion(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/classify/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiSuggestion({ type: data.predicted_type, confidence: data.confidence });
        }
      } catch {}
    }, 600);
    setClassifyTimeout(timeout);
  };

  const handleRaiseIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      const res = await fetch(`${API}/alerts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emergency_type: emergencyType,
          details,
          room_number: roomNumber,
          lat: coords?.lat || 28.6139,
          lng: coords?.lng || 77.2090,
        }),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setEmergencyType('routine');
        setDetails('');
        setRoomNumber('');
        fetchIssues();
        setTimeout(() => setSubmitStatus('idle'), 3000);
      }
    } catch {
      setSubmitStatus('idle');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login-select');
  };

  const activeIssues = allIssues.filter((a) => a.status !== 'resolved');
  const resolvedIssues = allIssues.filter((a) => a.status === 'resolved');


  const tabs: { id: CustomerTab; icon: any; label: string }[] = [
    { id: 'raise', icon: Plus, label: 'Raise Issue' },
    { id: 'status', icon: Eye, label: 'Status Check' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <div className="flex h-screen bg-[#0b0f1a] overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-[280px] bg-[#0f1420] border-r border-white/[0.06] flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Customer Portal</h1>
                <span className="text-[10px] text-[#4a5577] font-mono uppercase tracking-wider">Crisis Response</span>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/[0.05] cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/[0.12] to-teal-500/[0.06] text-cyan-400 border border-cyan-500/20'
                  : 'text-[#64748b] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Stats footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
              <div className="text-lg font-bold text-cyan-400">{activeIssues.length}</div>
              <div className="text-[9px] text-[#64748b] uppercase tracking-wider font-medium">Active</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
              <div className="text-lg font-bold text-emerald-400">{resolvedIssues.length}</div>
              <div className="text-[9px] text-[#64748b] uppercase tracking-wider font-medium">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        {/* === Raise Issue Tab === */}
        {activeTab === 'raise' && (
          <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Raise an Issue</h2>
              <p className="text-[#8892b0] text-sm font-mono">Report an emergency or issue for immediate assistance</p>
            </div>

            {submitStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-20 animate-float-up">
                <div className="w-20 h-20 rounded-full bg-[#30d158]/10 border border-[#30d158]/15 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(48,209,88,0.15)]">
                  <CheckCircle2 className="w-10 h-10 text-[#30d158]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Issue Submitted!</h3>
                <p className="text-[#8892b0] text-sm font-mono mb-6">Our team has been notified and will respond shortly.</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="px-6 py-2.5 text-sm text-[#8892b0] hover:text-white glass-card rounded-xl transition-all cursor-pointer font-mono"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleRaiseIssue} className="space-y-6">
                {/* Emergency Type */}
                <div>
                  <label className="block text-[10px] font-medium text-[#8892b0] mb-3 uppercase tracking-[0.2em] font-mono">Emergency Type</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {EMERGENCY_TYPES.map((et) => (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => setEmergencyType(et.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                          emergencyType === et.id
                            ? `bg-gradient-to-br ${et.active} border-transparent text-white shadow-lg`
                            : `${et.inactive} border hover:border-white/[0.1]`
                        }`}
                      >
                        <et.icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider">{et.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room / Location */}
                <div>
                  <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Room / Location</label>
                  <input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., Room 312, Lobby, Pool Area"
                    className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/30 transition-all placeholder:text-[#4a5577]"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Details</label>
                  <textarea
                    value={details}
                    onChange={(e) => handleDetailsChange(e.target.value)}
                    placeholder="Describe the situation in detail... (AI will auto-detect the type)"
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/30 transition-all placeholder:text-[#4a5577] resize-none"
                  />
                </div>

                {/* AI Smart Detection Suggestion */}
                {aiSuggestion && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01]"
                    style={{
                      background: `${EMERGENCY_TYPES.find(t => t.id === aiSuggestion.type)?.color || '#8892b0'}10`,
                      borderColor: `${EMERGENCY_TYPES.find(t => t.id === aiSuggestion.type)?.color || '#8892b0'}30`,
                    }}
                    onClick={() => setEmergencyType(aiSuggestion.type)}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs text-[#8892b0] font-mono">AI detected: </span>
                      <span className="text-sm font-semibold text-white capitalize">{aiSuggestion.type}</span>
                      <span className="text-xs text-[#64748b] ml-2 font-mono">({(aiSuggestion.confidence * 100).toFixed(0)}% confident)</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Click to apply</span>
                  </div>
                )}

                {/* Location display */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-[#8892b0] font-mono text-xs">
                    {coords ? `Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring location...'}
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm btn-command"
                >
                  <Send className="w-4 h-4" />
                  {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Issue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* === Status Check Tab === */}
        {activeTab === 'status' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Status Check</h2>
              <p className="text-[#8892b0] text-sm font-mono">Track your active issues in real-time</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-60">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : activeIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-[#334155]">
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium text-[#64748b]">No active issues</p>
                <p className="text-xs mt-1 text-[#475569]">All clear — no pending issues found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeIssues.map((issue) => {
                  const currentIdx = STATUS_STEPS.indexOf(issue.status);
                  const eType = EMERGENCY_TYPES.find((t) => t.id === issue.emergency_type) || EMERGENCY_TYPES[4];
                  const TypeIcon = eType.icon;
                  return (
                    <div key={issue.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${eType.color}15`, border: `1px solid ${eType.color}30` }}>
                            <TypeIcon className="w-5 h-5" style={{ color: eType.color }} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {eType.label} #{issue.id}
                            </h3>
                            <span className="text-[10px] text-[#4a5577] font-mono">{timeAgo(issue.timestamp)}</span>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase`}
                          style={{
                            background: `${SEVERITY_COLORS[issue.severity] || '#f59e0b'}15`,
                            color: SEVERITY_COLORS[issue.severity] || '#f59e0b',
                            border: `1px solid ${SEVERITY_COLORS[issue.severity] || '#f59e0b'}30`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[issue.severity] || '#f59e0b' }} />
                          {issue.severity}
                        </div>
                      </div>

                      {issue.details && (
                        <p className="text-xs text-[#8892b0] mb-4 pl-[52px]">{issue.details}</p>
                      )}

                      {/* Status Pipeline */}
                      <div className="flex items-center gap-1 pl-[52px]">
                        {STATUS_STEPS.map((step, i) => {
                          const isActive = i <= currentIdx;
                          const isCurrent = step === issue.status;
                          return (
                            <div key={step} className="flex items-center gap-1 flex-1">
                              <div
                                className={`flex-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all ${
                                  isCurrent
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                                    : isActive
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                                    : 'bg-white/[0.02] text-[#334155] border border-white/[0.04]'
                                }`}
                              >
                                {STATUS_LABELS[step]}
                              </div>
                              {i < STATUS_STEPS.length - 1 && (
                                <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-[#1e293b]'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={fetchIssues}
              className="mt-6 w-full py-2.5 text-xs text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer font-mono"
            >
              Refresh Status
            </button>
          </div>
        )}

        {/* === History Tab === */}
        {activeTab === 'history' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Issue History</h2>
              <p className="text-[#8892b0] text-sm font-mono">Complete log of all reported issues</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-60">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : allIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-[#334155]">
                <History className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium text-[#64748b]">No history yet</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">ID</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">Type</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">Severity</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">Status</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">Room</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[#64748b] uppercase tracking-wider font-mono font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allIssues.map((issue, idx) => {
                      const eType = EMERGENCY_TYPES.find((t) => t.id === issue.emergency_type) || EMERGENCY_TYPES[4];
                      const TypeIcon = eType.icon;
                      return (
                        <tr
                          key={issue.id}
                          className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                        >
                          <td className="px-5 py-3.5 text-xs text-white font-mono font-semibold">#{issue.id}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-3.5 h-3.5" style={{ color: eType.color }} />
                              <span className="text-xs text-[#94a3b8] capitalize">{(issue.emergency_type || 'routine').replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase"
                              style={{
                                background: `${SEVERITY_COLORS[issue.severity] || '#f59e0b'}12`,
                                color: SEVERITY_COLORS[issue.severity] || '#f59e0b',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[issue.severity] || '#f59e0b' }} />
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg uppercase font-mono ${
                              issue.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-white/[0.04] text-[#64748b]'
                            }`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#64748b] font-mono">{issue.room_number || '—'}</td>
                          <td className="px-5 py-3.5 text-xs text-[#4a5577] font-mono">{timeAgo(issue.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
