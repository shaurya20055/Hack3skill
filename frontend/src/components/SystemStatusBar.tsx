import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Shield, Activity, Clock, Users, Wifi, AlertTriangle } from 'lucide-react';

interface SystemStatusBarProps {
  activeAlerts: number;
  criticalCount: number;
  avgResponseTime: number | null;
  isConnected: boolean;
}

export const SystemStatusBar = ({ activeAlerts, criticalCount, avgResponseTime, isConnected }: SystemStatusBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const stats = [
    {
      icon: AlertTriangle,
      label: 'Active',
      value: activeAlerts.toString(),
      color: activeAlerts > 0 ? 'text-[#ff2d55]' : 'text-[#30d158]',
      glow: activeAlerts > 0,
    },
    {
      icon: Shield,
      label: 'Critical',
      value: criticalCount.toString(),
      color: criticalCount > 0 ? 'text-[#ff2d55]' : 'text-[#8892b0]',
      glow: criticalCount > 0,
    },
    {
      icon: Activity,
      label: 'Avg Response',
      value: avgResponseTime ? `${Math.round(avgResponseTime / 60)}m` : '—',
      color: 'text-[#0af0ff]',
      glow: false,
    },
    {
      icon: Users,
      label: 'Staff Online',
      value: '—',
      color: 'text-[#8892b0]',
      glow: false,
    },
  ];

  return (
    <div
      ref={barRef}
      className="col-span-full glass-panel border-b border-white/[0.04] px-4 py-2 flex items-center justify-between z-40"
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0af0ff] via-[#00b4d8] to-[#bf5af2] flex items-center justify-center shadow-[0_0_20px_rgba(10,240,255,0.2)]">
          <Shield className="w-4 h-4 text-[#060a13]" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-none">RAPID CRISIS</h1>
          <p className="text-[9px] text-[#4a5577] uppercase tracking-[0.2em] font-mono">Command Center</p>
        </div>
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <stat.icon className={`w-3.5 h-3.5 ${stat.color} ${stat.glow ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col">
              <span className={`text-sm font-bold font-mono ${stat.color} ${stat.glow ? 'animate-counter-glow' : ''}`}>
                {stat.value}
              </span>
              <span className="text-[8px] text-[#4a5577] uppercase tracking-[0.15em] font-mono leading-none">
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Connection + Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-[#30d158]' : 'text-[#ff2d55]'}`} />
          <span className={`text-[10px] font-mono ${isConnected ? 'text-[#30d158]' : 'text-[#ff2d55]'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#4a5577]">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono font-medium text-[#8892b0]">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </div>
  );
};
