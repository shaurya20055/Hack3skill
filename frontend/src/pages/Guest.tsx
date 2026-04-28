import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import gsap from 'gsap';
import {
  ShieldAlert, XCircle, CheckCircle2, Shield, MapPin, AlertTriangle,
  Flame, HeartPulse, ShieldCheck, Droplets, ClipboardList, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AIChat } from '../components/AIChat';
import { WS_URL } from '../config';

const EMERGENCY_TYPES = [
  { id: 'fire', label: 'Fire', icon: Flame, color: 'from-[#ff2d55] to-[#d91e48]', glow: 'shadow-[0_0_20px_rgba(255,45,85,0.3)]', inactive: 'bg-[#ff2d55]/[0.08] border-[#ff2d55]/15 text-[#ff2d55]' },
  { id: 'flood', label: 'Flood', icon: Droplets, color: 'from-[#0ea5e9] to-[#0284c7]', glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]', inactive: 'bg-[#0ea5e9]/[0.08] border-[#0ea5e9]/15 text-[#0ea5e9]' },
  { id: 'medical', label: 'Medical', icon: HeartPulse, color: 'from-[#ff6b9d] to-[#ff2d7a]', glow: 'shadow-[0_0_20px_rgba(255,107,157,0.3)]', inactive: 'bg-[#ff6b9d]/[0.08] border-[#ff6b9d]/15 text-[#ff6b9d]' },
  { id: 'security', label: 'Security', icon: ShieldCheck, color: 'from-[#ff9500] to-[#e08600]', glow: 'shadow-[0_0_20px_rgba(255,149,0,0.3)]', inactive: 'bg-[#ff9500]/[0.08] border-[#ff9500]/15 text-[#ff9500]' },
  { id: 'routine', label: 'Routine', icon: ClipboardList, color: 'from-[#8892b0] to-[#6a7394]', glow: 'shadow-[0_0_15px_rgba(136,146,176,0.2)]', inactive: 'bg-[#8892b0]/[0.08] border-[#8892b0]/15 text-[#8892b0]' },
];

export const Guest = () => {
  const [status, setStatus] = useState<'idle' | 'form' | 'countdown' | 'sent'>('idle');
  const [countdown, setCountdown] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [impactDetected, setImpactDetected] = useState(false);
  const [emergencyType, setEmergencyType] = useState('routine');
  const [details, setDetails] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [systemBroadcast, setSystemBroadcast] = useState<string | null>(null);

  const sosRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { sendJsonMessage } = useWebSocket(WS_URL, {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'system_broadcast') {
          setSystemBroadcast(data.message);
          setTimeout(() => setSystemBroadcast(null), 15000);
        }
      } catch { }
    },
    shouldReconnect: () => true,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // GSAP animations on status change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 25, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [status]);

  // SOS button pulse
  useEffect(() => {
    if (sosRef.current && status === 'idle') {
      gsap.to(sosRef.current, {
        boxShadow: '0 0 60px rgba(255,45,85,0.4), 0 0 120px rgba(255,45,85,0.15)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }, [status]);

  const submitForm = () => {
    setStatus('countdown');
    setCountdown(10);

    if (window.DeviceMotionEvent) {
      const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (acc && acc.x && acc.y && acc.z) {
          const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
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
    setEmergencyType('routine');
    setDetails('');
    setRoomNumber('');
  };

  const sendAlert = () => {
    sendJsonMessage({
      type: 'sos_trigger',
      coordinates: coords || { lat: 28.6139, lng: 77.2090 },
      sensor_data: { impact_detected: impactDetected },
      emergency_type: emergencyType,
      details, room_number: roomNumber,
    });
    setStatus('sent');
  };

  return (
    <div className="min-h-screen bg-[#060a13] flex flex-col relative overflow-hidden">
      {/* System Broadcast Banner */}
      {systemBroadcast && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#ff2d55]/95 to-[#d91e48]/95 backdrop-blur-xl text-white px-6 py-3.5 text-center animate-slide-top">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">{systemBroadcast}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-6 py-4 z-10 border-b border-white/[0.04] glass-panel">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#4a5577]" />
          <span className="text-sm text-[#4a5577] font-mono">Rapid Crisis Response</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[#4a5577] font-mono">
            <MapPin className="w-3.5 h-3.5" />
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring…'}
          </div>
          <Link to="/login" className="text-[10px] text-[#8892b0] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04] border border-white/[0.04] font-mono uppercase tracking-wider">
            Staff Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Ambient glows */}
        {status === 'idle' && <div className="absolute w-[400px] h-[400px] bg-[#ff2d55]/[0.04] rounded-full blur-[120px] pointer-events-none" />}
        {status === 'countdown' && <div className="absolute w-[500px] h-[500px] bg-[#ff2d55]/[0.1] rounded-full blur-[130px] pointer-events-none animate-pulse" />}
        {status === 'form' && <div className="absolute w-[450px] h-[450px] bg-[#0af0ff]/[0.04] rounded-full blur-[120px] pointer-events-none" />}

        <div ref={contentRef}>
          {/* === IDLE — SOS Button === */}
          {status === 'idle' && (
            <div className="flex flex-col items-center text-center">
              <p className="text-[#4a5577] text-[10px] mb-8 uppercase tracking-[0.3em] font-mono font-semibold">
                Emergency SOS
              </p>
              <button
                ref={sosRef}
                onClick={() => setStatus('form')}
                className="w-52 h-52 rounded-full bg-gradient-to-br from-[#ff2d55] to-[#d91e48] flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                id="sos-button"
              >
                <ShieldAlert className="w-14 h-14 mb-2" />
                <span className="text-2xl font-black tracking-[0.2em]">SOS</span>
              </button>
              <p className="text-[#4a5577] text-[11px] mt-8 max-w-xs font-mono">
                Tap to report an emergency. You'll select the type and provide details before dispatch.
              </p>
            </div>
          )}

          {/* === FORM === */}
          {status === 'form' && (
            <div className="w-full max-w-lg">
              <h2 className="text-2xl font-bold text-white text-center mb-2">Report Emergency</h2>
              <p className="text-[#8892b0] text-sm text-center mb-8 font-mono">Select type and provide details</p>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                {EMERGENCY_TYPES.map((et) => (
                  <button
                    key={et.id}
                    onClick={() => setEmergencyType(et.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${emergencyType === et.id
                        ? `bg-gradient-to-br ${et.color} border-transparent text-white ${et.glow}`
                        : `${et.inactive} border hover:border-white/[0.1]`
                      }`}
                  >
                    <et.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider">{et.label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Room / Location</label>
                <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g., Room 312, Lobby"
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Details (optional)</label>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the situation..." rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={cancelSOS} className="flex-1 py-3 text-sm text-[#8892b0] hover:text-white glass-card rounded-xl transition-all cursor-pointer font-mono">Cancel</button>
                <button onClick={submitForm} className="flex-1 flex items-center justify-center gap-2 py-3 btn-critical text-white font-bold rounded-xl btn-command">
                  <Send className="w-4 h-4" /> Send Alert
                </button>
              </div>
            </div>
          )}

          {/* === COUNTDOWN === */}
          {status === 'countdown' && (
            <div className="flex flex-col items-center text-center">
              <p className="text-[#ff2d55]/80 text-[10px] mb-4 uppercase tracking-[0.3em] font-mono font-bold">Alert Activating</p>

              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,45,85,0.08)" strokeWidth="3" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke="#ff2d55" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - countdown / 10)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,45,85,0.5))' }}
                  />
                </svg>
                <span className="text-7xl font-black text-white font-mono">{countdown}</span>
              </div>

              <div className="flex items-center gap-2 text-[#8892b0] mb-4 text-sm font-mono">
                <span className="capitalize font-bold text-white">{emergencyType.replace('_', ' ')}</span>
                {roomNumber && <span>• Room {roomNumber}</span>}
              </div>

              <p className="text-[#8892b0] mb-10 text-sm font-mono">Dispatching in {countdown}s…</p>

              <button onClick={cancelSOS}
                className="group flex items-center gap-2.5 px-8 py-4 btn-safe text-white font-bold text-lg rounded-2xl btn-command">
                <XCircle className="w-6 h-6" /> I'M SAFE — Cancel
              </button>
            </div>
          )}

          {/* === SENT === */}
          {status === 'sent' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#30d158]/10 border border-[#30d158]/15 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(48,209,88,0.15)]">
                <CheckCircle2 className="w-10 h-10 text-[#30d158]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Alert Dispatched</h2>
              <p className="text-[#8892b0] text-sm mb-3 max-w-xs font-mono">
                Security has been notified. Help is on the way.
              </p>
              <div className="flex items-center gap-3 text-[10px] text-[#4a5577] mb-8 font-mono uppercase tracking-wider">
                <span className="capitalize px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">{emergencyType.replace('_', ' ')}</span>
                {roomNumber && <span className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">Room {roomNumber}</span>}
              </div>
              <button onClick={() => { setStatus('idle'); setEmergencyType('routine'); setDetails(''); setRoomNumber(''); }}
                className="px-6 py-2.5 text-sm text-[#8892b0] hover:text-white glass-card rounded-xl transition-all cursor-pointer font-mono">
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      <AIChat context="Guest emergency interface" floating={true} />
    </div>
  );
};
