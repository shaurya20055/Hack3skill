import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../useWebSocket';
import { ShieldAlert, XCircle, CheckCircle2, Shield, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const WS_URL = 'ws://127.0.0.1:8000/ws/alerts/';

export const Guest = () => {
  const [status, setStatus] = useState<'idle' | 'countdown' | 'sent'>('idle');
  const [countdown, setCountdown] = useState(10);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [impactDetected, setImpactDetected] = useState(false);
  
  const { sendJsonMessage } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const triggerSOS = () => {
    setStatus('countdown');
    setCountdown(10);
    
    if (window.DeviceMotionEvent) {
      const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (acc && acc.x && acc.y && acc.z) {
          const magnitude = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
          if (magnitude > 15) setImpactDetected(true);
        }
      };
      window.addEventListener('devicemotion', handleMotion);
      setTimeout(() => window.removeEventListener('devicemotion', handleMotion), 5000);
    } else {
      setImpactDetected(Math.random() > 0.5);
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sendAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    setImpactDetected(false);
  };

  const sendAlert = () => {
    sendJsonMessage({
      type: 'sos_trigger',
      coordinates: coords || { lat: 34.0522, lng: -118.2437 },
      sensor_data: { impact_detected: impactDetected },
    });
    setStatus('sent');
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-6 py-4 z-10 border-b border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#64748b]" />
          <span className="text-sm text-[#64748b]">CrisisResponse</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-[#475569]">
          <MapPin className="w-3.5 h-3.5" />
          {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring location…'}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Ambient glow */}
        {status === 'idle' && (
          <div className="absolute w-[400px] h-[400px] bg-red-600/[0.06] rounded-full blur-[100px] pointer-events-none" />
        )}
        {status === 'countdown' && (
          <div className="absolute w-[500px] h-[500px] bg-red-600/[0.15] rounded-full blur-[120px] pointer-events-none animate-pulse" />
        )}

        {status === 'idle' && (
          <div className="flex flex-col items-center text-center animate-float-up">
            <p className="text-[#64748b] text-sm mb-8 uppercase tracking-widest font-medium">Emergency SOS</p>
            <button 
              onClick={triggerSOS}
              className="w-52 h-52 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer"
            >
              <ShieldAlert className="w-14 h-14 mb-2" />
              <span className="text-2xl font-black tracking-wider">SOS</span>
            </button>
            <p className="text-[#475569] text-sm mt-8 max-w-xs">Tap the button to trigger an emergency alert. A 10-second countdown will allow you to cancel.</p>
          </div>
        )}

        {status === 'countdown' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-red-400/80 text-sm mb-4 uppercase tracking-widest font-medium">Alert Activating</p>
            
            {/* Countdown ring */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="4" />
                <circle 
                  cx="100" cy="100" r="90" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="4" 
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - countdown / 10)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="text-7xl font-black text-white">{countdown}</span>
            </div>

            <p className="text-[#94a3b8] mb-10 text-sm">Dispatching alert in {countdown} seconds…</p>
            
            <button 
              onClick={cancelSOS}
              className="group flex items-center gap-2.5 px-8 py-4 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl text-emerald-400 hover:text-white font-semibold text-lg transition-all duration-300"
            >
              <XCircle className="w-6 h-6" />
              I'M SAFE — Cancel
            </button>
          </div>
        )}

        {status === 'sent' && (
          <div className="flex flex-col items-center text-center animate-float-up">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Alert Dispatched</h2>
            <p className="text-[#94a3b8] text-sm mb-8 max-w-xs">Security has been notified with your coordinates and sensor data. Help is on the way.</p>
            
            <button 
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 text-sm text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all"
            >
              Reset Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
