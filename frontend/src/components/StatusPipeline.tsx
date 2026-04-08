import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ChevronRight, Check } from 'lucide-react';

const STATUS_STEPS = ['reported', 'acknowledged', 'responding', 'resolved'];
const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  responding: 'Responding',
  resolved: 'Resolved',
};

interface StatusPipelineProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export const StatusPipeline = ({ currentStatus, onStatusChange }: StatusPipelineProps) => {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  useEffect(() => {
    if (pipelineRef.current) {
      gsap.fromTo(pipelineRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [currentStatus]);

  return (
    <div>
      <h4 className="text-[10px] text-[#8892b0] uppercase tracking-[0.15em] font-semibold mb-3 font-mono">
        Status Pipeline
      </h4>
      <div ref={pipelineRef} className="flex items-center gap-1">
        {STATUS_STEPS.map((step, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = step === currentStatus;
          const isNext = i === currentIdx + 1;
          const isResolved = step === 'resolved';

          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  if (isNext || (isResolved && currentIdx < 3)) {
                    onStatusChange(step);
                  }
                }}
                disabled={!isNext && !isResolved}
                className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-[0.1em] rounded-lg transition-all duration-300 cursor-pointer font-mono relative overflow-hidden ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#0af0ff] to-[#00b4d8] text-[#060a13] shadow-[0_0_20px_rgba(10,240,255,0.25)]'
                    : isActive
                    ? 'bg-[#0af0ff]/10 text-[#0af0ff] border border-[#0af0ff]/20'
                    : isNext
                    ? 'bg-white/[0.03] text-[#8892b0] border border-white/[0.08] hover:bg-[#0af0ff]/[0.06] hover:text-[#0af0ff] hover:border-[#0af0ff]/20'
                    : 'bg-white/[0.02] text-[#4a5577] border border-white/[0.04]'
                }`}
              >
                {isCurrent && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
                <span className="relative flex items-center justify-center gap-1">
                  {isActive && i < currentIdx && <Check className="w-3 h-3" />}
                  {STATUS_LABELS[step]}
                </span>
              </button>
              {i < STATUS_STEPS.length - 1 && (
                <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#0af0ff]/60' : 'text-[#1c2742]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
