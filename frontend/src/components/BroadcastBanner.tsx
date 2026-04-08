import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { AlertTriangle, X, Volume2 } from 'lucide-react';

interface BroadcastBannerProps {
  message: string;
  severity: string;
  onDismiss: () => void;
}

export const BroadcastBanner = ({ message, severity, onDismiss }: BroadcastBannerProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current) {
      gsap.fromTo(bannerRef.current,
        { y: -80, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
      );
    }

    // Auto-dismiss progress bar (15 seconds)
    if (progressRef.current) {
      gsap.fromTo(progressRef.current,
        { scaleX: 1, transformOrigin: 'left' },
        { scaleX: 0, duration: 15, ease: 'none', onComplete: onDismiss }
      );
    }

    // Try to play alert sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const handleDismiss = () => {
    if (bannerRef.current) {
      gsap.to(bannerRef.current, {
        y: -80, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: onDismiss,
      });
    }
  };

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[60]"
    >
      <div className={`relative overflow-hidden ${
        severity === 'critical'
          ? 'bg-gradient-to-r from-[#ff2d55]/95 via-[#ff2d55]/90 to-[#d91e48]/95'
          : 'bg-gradient-to-r from-[#ff9500]/90 to-[#e08600]/90'
      } backdrop-blur-xl`}>
        {/* Urgency glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.05]" />

        <div className="relative flex items-center justify-center gap-3 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            <Volume2 className="w-4 h-4 text-white/70" />
          </div>
          <span className="font-bold text-sm text-white tracking-wide uppercase">
            ⚠ EMERGENCY BROADCAST
          </span>
          <span className="text-white/90 text-sm font-medium mx-2">—</span>
          <span className="text-white text-sm font-medium">{message}</span>
          <button
            onClick={handleDismiss}
            className="ml-4 text-white/50 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="h-0.5 bg-white/10 w-full">
          <div ref={progressRef} className="h-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
