import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Brain, ChevronRight, Sparkles } from 'lucide-react';

interface AIInsightsProps {
  suggestion?: string;
  summary?: string;
  analyticsInsights?: {
    summary?: string;
    recommendations?: string[];
    most_common?: string;
    high_risk_areas?: string[];
  };
}

export const AIInsights = ({ suggestion, summary, analyticsInsights }: AIInsightsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('.ai-item');
      gsap.fromTo(items,
        { opacity: 0, x: 10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [suggestion, analyticsInsights]);

  return (
    <div ref={containerRef} className="space-y-3">
      {/* AI Suggestion for current alert */}
      {suggestion && (
        <div className="ai-item glass-card glass-card-ai p-4 rounded-xl relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#bf5af2]/[0.06] rounded-full blur-3xl pointer-events-none" />

          <h4 className="text-[10px] text-[#bf5af2] uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-1.5 font-mono relative">
            <Sparkles className="w-3 h-3" /> AI Recommendation
          </h4>
          <p className="text-[12px] text-[#c8cee0] leading-relaxed relative">{suggestion}</p>
        </div>
      )}

      {summary && (
        <div className="ai-item glass-card p-3 rounded-xl">
          <h4 className="text-[10px] text-[#8892b0] uppercase tracking-[0.15em] font-bold mb-1.5 flex items-center gap-1.5 font-mono">
            <Brain className="w-3 h-3 text-[#bf5af2]" /> AI Summary
          </h4>
          <p className="text-[11px] text-[#8892b0]">{summary}</p>
        </div>
      )}

      {/* Analytics insights */}
      {analyticsInsights && (
        <div className="ai-item glass-card glass-card-ai p-4 rounded-xl relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#bf5af2]/[0.04] rounded-full blur-3xl pointer-events-none" />

          <h4 className="text-[10px] text-[#bf5af2] uppercase tracking-[0.15em] font-bold mb-2 flex items-center gap-1.5 font-mono relative">
            <Brain className="w-3.5 h-3.5" /> AI Intelligence
          </h4>

          {analyticsInsights.summary && (
            <p className="text-[12px] text-[#c8cee0] mb-3 leading-relaxed relative">{analyticsInsights.summary}</p>
          )}

          {analyticsInsights.recommendations && (
            <div className="space-y-1.5 relative">
              {analyticsInsights.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-[#8892b0]">
                  <ChevronRight className="w-3 h-3 text-[#bf5af2] mt-0.5 flex-shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {analyticsInsights.high_risk_areas && analyticsInsights.high_risk_areas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.04] relative">
              <span className="text-[9px] text-[#4a5577] uppercase tracking-[0.15em] font-mono">
                High-Risk Zones:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {analyticsInsights.high_risk_areas.map((area, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#ff2d55]/[0.06] border border-[#ff2d55]/10 text-[#ff2d55]/70 font-mono">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
