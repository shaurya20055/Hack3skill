import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  Flame, HeartPulse, ShieldCheck, AlertTriangle, HelpCircle, Clock, MapPin
} from 'lucide-react';
import type { AlertData } from '../store';

const TYPE_ICONS: Record<string, any> = {
  fire: Flame,
  medical: HeartPulse,
  security: ShieldCheck,
  natural_disaster: AlertTriangle,
  other: HelpCircle,
};

const TYPE_LABELS: Record<string, string> = {
  fire: 'Fire',
  medical: 'Medical',
  security: 'Security',
  natural_disaster: 'Disaster',
  other: 'Other',
};

const SEVERITY_CONFIG: Record<string, { glow: string; dot: string; badge: string; cardClass: string }> = {
  critical: {
    glow: 'shadow-[0_0_25px_rgba(255,45,85,0.15)]',
    dot: 'bg-[#ff2d55]',
    badge: 'bg-[#ff2d55]/10 text-[#ff2d55] border-[#ff2d55]/20',
    cardClass: 'glass-card-critical animate-pulse-critical',
  },
  medium: {
    glow: 'shadow-[0_0_20px_rgba(255,149,0,0.1)]',
    dot: 'bg-[#ff9500]',
    badge: 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20',
    cardClass: 'glass-card-warning',
  },
  low: {
    glow: '',
    dot: 'bg-[#30d158]',
    badge: 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20',
    cardClass: 'glass-card-safe',
  },
};

function timeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface AlertCardProps {
  alert: AlertData;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export const AlertCard = ({ alert, isSelected, onClick, index }: AlertCardProps) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const TypeIcon = TYPE_ICONS[alert.emergency_type] || HelpCircle;

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, x: -20, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, delay: index * 0.06, ease: 'power3.out' }
      );
    }
  }, [index]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(cardRef.current, {
      rotateX: -y * 4,
      rotateY: x * 4,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  };

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-[#0af0ff]/30 bg-[#0af0ff]/[0.04] shadow-[0_0_30px_rgba(10,240,255,0.08)]'
          : `glass-card ${severity.cardClass} ${severity.glow}`
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            alert.severity === 'critical' ? 'bg-[#ff2d55]/15 text-[#ff2d55]' :
            alert.severity === 'medium' ? 'bg-[#ff9500]/15 text-[#ff9500]' :
            'bg-[#30d158]/15 text-[#30d158]'
          }`}>
            <TypeIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white block leading-tight">
              {TYPE_LABELS[alert.emergency_type] || 'Incident'} #{alert.id}
            </span>
            {alert.room_number && (
              <span className="text-[10px] text-[#8892b0] flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> Room {alert.room_number}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#4a5577]">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-mono">{timeAgo(alert.timestamp)}</span>
        </div>
      </div>

      {alert.details && (
        <p className="text-[11px] text-[#8892b0] mb-2.5 line-clamp-1 pl-[42px]">{alert.details}</p>
      )}

      <div className="flex items-center justify-between pl-[42px]">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold ${severity.badge} border uppercase tracking-wider`}>
          <span className={`w-1.5 h-1.5 rounded-full ${severity.dot} ${alert.severity === 'critical' ? 'animate-pulse' : ''}`} />
          {alert.severity}
        </div>
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-[#8892b0] uppercase tracking-wider">
          {alert.status}
        </span>
      </div>

      {/* Threat score bar */}
      <div className="mt-2.5 pl-[42px]">
        <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              alert.threat_score >= 75 ? 'bg-gradient-to-r from-[#ff2d55] to-[#ff6b6b]' :
              alert.threat_score >= 45 ? 'bg-gradient-to-r from-[#ff9500] to-[#ffb84d]' :
              'bg-gradient-to-r from-[#30d158] to-[#6ee7b7]'
            }`}
            style={{ width: `${alert.threat_score}%` }}
          />
        </div>
      </div>
    </button>
  );
};
