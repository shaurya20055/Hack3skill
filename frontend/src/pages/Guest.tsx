import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../useWebSocket';
import {
  ShieldAlert, XCircle, CheckCircle2, Shield, MapPin,
  Flame, HeartPulse, ShieldCheck, AlertTriangle, HelpCircle,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AIChat } from '../components/AIChat';

const WS_URL = 'ws://127.0.0.1:8000/ws/alerts/';

const EMERGENCY_TYPES = [
  { id: 'fire', label: 'Fire', icon: Flame, color: 'from-red-600 to-orange-600', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  { id: 'medical', label: 'Medical', icon: HeartPulse, color: 'from-pink-600 to-rose-600', border: 'border-pink-500/30', bg: 'bg-pink-500/10' },
  { id: 'security', label: 'Security', icon: ShieldCheck, color: 'from-amber-600 to-yellow-600', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  { id: 'natural_disaster', label: 'Disaster', icon: AlertTriangle, color: 'from-purple-600 to-indigo-600', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'from-slate-600 to-gray-600', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
];

export const Guest = () => {
  const [status, setStatus] = useState<'idle' | 'form' | 'countdown' | 'sent'>('idle');
  const [countdown, setCountdown] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [impactDetected, setImpactDetected] = useState(false);
  const [emergencyType, setEmergencyType] = useState('other');
  const [details, setDetails] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [systemBroadcast, setSystemBroadcast] = useState<string | null>(null);

  const { sendJsonMessage } = useWebSocket(WS_URL, {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'system_broadcast') {
          setSystemBroadcast(data.message);
          setTimeout(() => setSystemBroadcast(null), 15000);
        }
      } catch {}
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

  const startSOS = () => {
    setStatus('form');
  };

  const submitForm = () => {
    setStatus('countdown');
    setCountdown(10);

    // Sensor simulation
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
    setEmergencyType('other');
    setDetails('');
    setRoomNumber('');
  };

  const sendAlert = () => {
    sendJsonMessage({
      type: 'sos_trigger',
      coordinates: coords || { lat: 28.6139, lng: 77.2090 },
      sensor_data: { impact_detected: impactDetected },
      emergency_type: emergencyType,
      details: details,
      room_number: roomNumber,
    });
    setStatus('sent');
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col relative overflow-hidden">
      {/* System Broadcast Banner */}
      {systemBroadcast && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600/90 backdrop-blur-sm text-white px-6 py-3 text-center animate-float-up">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm">{systemBroadcast}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-6 py-4 z-10 border-b border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#64748b]" />
          <span className="text-sm text-[#64748b]">Rapid Crisis Response</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <MapPin className="w-3.5 h-3.5" />
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring location…'}
          </div>
          <Link
            to="/login"
            className="text-xs text-[#64748b] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05] border border-white/[0.06]"
          >
            Staff Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Ambient glow effects */}
        {status === 'idle' && (
          <div className="absolute w-[400px] h-[400px] bg-red-600/[0.06] rounded-full blur-[100px] pointer-events-none" />
        )}
        {status === 'countdown' && (
          <div className="absolute w-[500px] h-[500px] bg-red-600/[0.15] rounded-full blur-[120px] pointer-events-none animate-pulse" />
        )}
        {status === 'form' && (
          <div className="absolute w-[450px] h-[450px] bg-indigo-600/[0.08] rounded-full blur-[110px] pointer-events-none" />
        )}

        {/* === IDLE STATE — SOS Button === */}
        {status === 'idle' && (
          <div className="flex flex-col items-center text-center animate-float-up">
            <p className="text-[#64748b] text-sm mb-8 uppercase tracking-widest font-medium">
              Emergency SOS
            </p>
            <button
              onClick={startSOS}
              className="w-52 h-52 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer"
              id="sos-button"
            >
              <ShieldAlert className="w-14 h-14 mb-2" />
              <span className="text-2xl font-black tracking-wider">SOS</span>
            </button>
            <p className="text-[#475569] text-sm mt-8 max-w-xs">
              Tap the button to report an emergency. You'll select the type and provide details before alert is dispatched.
            </p>
          </div>
        )}

        {/* === FORM STATE — Emergency Details === */}
        {status === 'form' && (
          <div className="w-full max-w-lg animate-float-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Report Emergency</h2>
            <p className="text-[#64748b] text-sm text-center mb-8">Select emergency type and provide details</p>

            {/* Emergency Type Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {EMERGENCY_TYPES.map((et) => (
                <button
                  key={et.id}
                  onClick={() => setEmergencyType(et.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                    emergencyType === et.id
                      ? `bg-gradient-to-br ${et.color} border-transparent text-white shadow-lg`
                      : `${et.bg} ${et.border} text-[#94a3b8] hover:text-white hover:border-white/[0.15]`
                  }`}
                >
                  <et.icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{et.label}</span>
                </button>
              ))}
            </div>

            {/* Room Number */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">
                Room / Location
              </label>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g., Room 312, Lobby, Pool Area"
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-[#334155]"
              />
            </div>

            {/* Details */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the situation..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-[#334155] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelSOS}
                className="flex-1 py-3 text-sm text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send Emergency Alert
              </button>
            </div>
          </div>
        )}

        {/* === COUNTDOWN STATE === */}
        {status === 'countdown' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-red-400/80 text-sm mb-4 uppercase tracking-widest font-medium">
              Alert Activating
            </p>

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

            <div className="flex items-center gap-2 text-[#94a3b8] mb-4 text-sm">
              <span className="capitalize font-medium text-white">{emergencyType.replace('_', ' ')}</span>
              {roomNumber && <span>• Room {roomNumber}</span>}
            </div>

            <p className="text-[#94a3b8] mb-10 text-sm">Dispatching alert in {countdown} seconds…</p>

            <button
              onClick={cancelSOS}
              className="group flex items-center gap-2.5 px-8 py-4 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl text-emerald-400 hover:text-white font-semibold text-lg transition-all duration-300 cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
              I'M SAFE — Cancel
            </button>
          </div>
        )}

        {/* === SENT STATE === */}
        {status === 'sent' && (
          <div className="flex flex-col items-center text-center animate-float-up">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Alert Dispatched</h2>
            <p className="text-[#94a3b8] text-sm mb-3 max-w-xs">
              Security has been notified with your coordinates and emergency details. Help is on the way.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#475569] mb-8">
              <span className="capitalize px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                {emergencyType.replace('_', ' ')}
              </span>
              {roomNumber && (
                <span className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  Room {roomNumber}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setStatus('idle');
                setEmergencyType('other');
                setDetails('');
                setRoomNumber('');
              }}
              className="px-6 py-2.5 text-sm text-[#64748b] hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* AI Chat Widget */}
      <AIChat context="Guest emergency interface" floating={true} />
    </div>
  );
};
