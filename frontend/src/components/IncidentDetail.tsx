import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  X, MapPin, Clock, Activity, Check, Flame, HeartPulse, ShieldCheck,
  Droplets, ClipboardList, User
} from 'lucide-react';
import type { AlertData } from '../store';
import { StatusPipeline } from './StatusPipeline';
import { AIInsights } from './AIInsights';
import { ChatBox } from './ChatBox';
import type { ChatMsg } from '../store';

const TYPE_ICONS: Record<string, any> = {
  fire: Flame, flood: Droplets, medical: HeartPulse, security: ShieldCheck,
  routine: ClipboardList,
};

const TYPE_LABELS: Record<string, string> = {
  fire: 'Fire Emergency', flood: 'Flood Emergency', medical: 'Medical Emergency', security: 'Security Threat',
  routine: 'Routine Incident',
};

interface IncidentDetailProps {
  alert: AlertData;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onAssignStaff: (alertId: number, staffId: number) => void;
  staffList: any[];
  chatMessages: ChatMsg[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
}

export const IncidentDetail = ({
  alert, onClose, onStatusChange, onAssignStaff,
  staffList, chatMessages, chatInput, onChatInputChange, onSendChat
}: IncidentDetailProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const TypeIcon = TYPE_ICONS[alert.emergency_type] || ClipboardList;

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
      );
    }
  }, [alert.id]);

  const severityColor = alert.severity === 'critical' ? '#ff2d55'
    : alert.severity === 'medium' ? '#ff9500' : '#30d158';

  return (
    <div ref={panelRef} className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${severityColor}15`,
                boxShadow: `0 0 20px ${severityColor}15`,
              }}
            >
              <TypeIcon className="w-5 h-5" style={{ color: severityColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Incident #{alert.id}
              </h2>
              <p className="text-[11px] text-[#8892b0] font-mono">
                {TYPE_LABELS[alert.emergency_type] || 'Unknown'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#8892b0] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
            style={{
              background: `${severityColor}10`,
              borderColor: `${severityColor}25`,
              color: severityColor,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: severityColor }} />
            {alert.severity}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#0af0ff] bg-[#0af0ff]/[0.06] border border-[#0af0ff]/15 font-mono">
            <Activity className="w-3 h-3" /> {alert.threat_score}/100
          </span>
          {alert.room_number && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-[#8892b0] bg-white/[0.03] border border-white/[0.06]">
              <MapPin className="w-3 h-3" /> Room {alert.room_number}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Time info */}
        <div className="flex items-center gap-2 text-[11px] text-[#8892b0] font-mono">
          <Clock className="w-3 h-3" />
          {new Date(alert.timestamp).toLocaleString()}
          {alert.response_time && (
            <span className="ml-auto text-[#0af0ff]">
              Response: {Math.round(alert.response_time / 60)}min
            </span>
          )}
        </div>

        {/* Details */}
        {alert.details && (
          <div className="glass-card p-3.5 rounded-xl">
            <h4 className="text-[9px] text-[#4a5577] uppercase tracking-[0.2em] font-mono font-bold mb-1.5">Details</h4>
            <p className="text-[12px] text-[#c8cee0] leading-relaxed">{alert.details}</p>
          </div>
        )}

        {/* AI Insights */}
        <AIInsights suggestion={alert.ai_suggestion} summary={alert.ai_summary} />

        {/* Status Pipeline */}
        <StatusPipeline
          currentStatus={alert.status}
          onStatusChange={(status) => onStatusChange(alert.id, status)}
        />

        {/* Staff Assignment */}
        <div className="flex items-center gap-2.5">
          {staffList.length > 0 && (
            <div className="flex-1">
              <select
                onChange={(e) => {
                  if (e.target.value) onAssignStaff(alert.id, parseInt(e.target.value));
                }}
                value={alert.assigned_staff || ''}
                className="w-full bg-white/[0.03] border border-white/[0.06] text-[#8892b0] rounded-xl px-3 py-2.5 text-[11px] focus:outline-none focus:border-[#0af0ff]/30 cursor-pointer font-mono"
              >
                <option value="">Assign Staff...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name || s.username} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {alert.assigned_staff_details && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#8892b0] bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.06]">
              <User className="w-3 h-3 text-[#0af0ff]" />
              <span className="font-mono">
                {alert.assigned_staff_details.first_name || alert.assigned_staff_details.username}
              </span>
            </div>
          )}
        </div>

        {/* Resolve button */}
        {alert.status !== 'resolved' && (
          <button
            onClick={() => onStatusChange(alert.id, 'resolved')}
            className="w-full flex items-center justify-center gap-2 py-3 btn-safe text-white text-sm font-bold rounded-xl btn-command"
          >
            <Check className="w-4 h-4" /> Resolve Incident
          </button>
        )}

        {/* Divider */}
        <div className="border-t border-white/[0.04] pt-4">
          {/* Chat */}
          <ChatBox
            messages={chatMessages}
            alertId={alert.id}
            chatInput={chatInput}
            onInputChange={onChatInputChange}
            onSend={onSendChat}
          />
        </div>
      </div>
    </div>
  );
};
