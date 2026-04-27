import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { AIInsights } from './AIInsights';

interface AnalyticsPanelProps {
  analytics: any;
  loading: boolean;
  onRefresh: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff2d55',
  medium: '#ff9500',
  low: '#30d158',
};

const TYPE_COLORS: Record<string, string> = {
  fire: '#ff2d55',
  flood: '#0ea5e9',
  medical: '#ff6b9d',
  security: '#ff9500',
  routine: '#8892b0',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-[11px] shadow-xl">
      <p className="text-[#8892b0] mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export const AnalyticsPanel = ({ analytics, loading, onRefresh }: AnalyticsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current && analytics) {
      const cards = panelRef.current.querySelectorAll('.analytics-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 15, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="chart" className="h-40" />
        <Skeleton variant="card" className="h-28" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-[#4a5577]">
        <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-[11px] font-mono">Loading analytics...</p>
      </div>
    );
  }

  // Format data for charts
  const severityData = Object.entries(analytics.severity_breakdown || {}).map(([key, value]) => ({
    name: key,
    value: value as number,
    fill: SEVERITY_COLORS[key] || '#8892b0',
  }));

  const typeData = (analytics.by_type || []).map((item: any) => ({
    name: item.emergency_type.replace('_', ' '),
    count: item.count,
    fill: TYPE_COLORS[item.emergency_type] || '#8892b0',
  }));

  const trendData = (analytics.by_date || []).map((item: any) => ({
    date: item.date ? new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '',
    incidents: item.count,
  }));

  return (
    <div ref={panelRef} className="p-4 space-y-4 overflow-y-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Total', value: analytics.total_incidents, color: 'text-white', glow: '' },
          { label: 'Active', value: analytics.active_incidents, color: 'text-[#ff2d55]', glow: analytics.active_incidents > 0 ? 'text-glow-critical' : '' },
          { label: 'Resolved', value: analytics.resolved_incidents, color: 'text-[#30d158]', glow: '' },
          { label: 'Avg Response', value: analytics.avg_response_time ? `${Math.round(analytics.avg_response_time / 60)}m` : '—', color: 'text-[#0af0ff]', glow: '' },
        ].map((s, i) => (
          <div key={i} className="analytics-card glass-card p-3 rounded-xl tilt-card">
            <div className={`text-xl font-black font-mono ${s.color} ${s.glow}`}>{s.value}</div>
            <div className="text-[8px] text-[#4a5577] uppercase tracking-[0.2em] font-mono mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Incident Trend Chart */}
      {trendData.length > 1 && (
        <div className="analytics-card glass-card p-4 rounded-xl">
          <h4 className="text-[10px] font-bold text-[#8892b0] uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-3 h-3 text-[#0af0ff]" /> Incident Trend
          </h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0af0ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0af0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#4a5577', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5577', fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#0af0ff"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={{ fill: '#0af0ff', r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Severity Breakdown — Pie Chart */}
      {severityData.length > 0 && (
        <div className="analytics-card glass-card p-4 rounded-xl">
          <h4 className="text-[10px] font-bold text-[#8892b0] uppercase tracking-[0.15em] mb-3 font-mono">
            Severity Distribution
          </h4>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%" cy="50%"
                  innerRadius={28} outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {severityData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] text-[#8892b0] capitalize font-mono">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Type — Bar Chart */}
      {typeData.length > 0 && (
        <div className="analytics-card glass-card p-4 rounded-xl">
          <h4 className="text-[10px] font-bold text-[#8892b0] uppercase tracking-[0.15em] mb-3 font-mono">
            By Type
          </h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={typeData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fill: '#4a5577', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {typeData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insights */}
      {analytics.ai_insights && (
        <div className="analytics-card">
          <AIInsights analyticsInsights={analytics.ai_insights} />
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="analytics-card w-full py-2.5 text-[10px] font-mono text-[#8892b0] hover:text-[#0af0ff] glass-card hover:border-[#0af0ff]/20 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3" /> Refresh Analytics
      </button>
    </div>
  );
};
