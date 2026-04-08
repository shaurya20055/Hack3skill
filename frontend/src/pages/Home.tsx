import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  Shield, Zap, MapPin, Activity, ChevronRight, Radio, ArrowRight,
  Flame, MessageCircle, BarChart3, Bot, Megaphone, Sparkles, Globe, Lock, Wifi
} from 'lucide-react';

// ─── Animated Starfield Canvas ───
const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    interface Star {
      x: number; y: number; r: number; vx: number; vy: number; alpha: number; pulse: number;
    }

    const stars: Star[] = Array.from({ length: 180 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Shooting stars
    interface ShootingStar {
      x: number; y: number; len: number; speed: number; angle: number; alpha: number; active: boolean;
    }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      if (shootingStars.length < 2 && Math.random() < 0.003) {
        shootingStars.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.3,
          len: Math.random() * 80 + 40,
          speed: Math.random() * 6 + 4,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          alpha: 1,
          active: true,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        s.pulse += 0.015;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;

        const flicker = s.alpha + Math.sin(s.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${Math.max(0.05, flicker)})`;
        ctx.fill();

        // Glow
        if (s.r > 1.2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 180, 255, ${flicker * 0.08})`;
          ctx.fill();
        }
      }

      // Draw connections between close stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.04 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= 0.012;

        if (ss.alpha <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;

        const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(180, 220, 255, ${ss.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 255, ${ss.alpha * 0.8})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

// ─── Floating Orbs ───
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(10,240,255,0.08) 0%, transparent 70%)',
        animation: 'float-orb-1 20s ease-in-out infinite',
      }} />
    <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(191,90,242,0.08) 0%, transparent 70%)',
        animation: 'float-orb-2 25s ease-in-out infinite',
      }} />
    <div className="absolute bottom-[20%] left-[30%] w-[350px] h-[350px] rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(255,45,85,0.06) 0%, transparent 70%)',
        animation: 'float-orb-3 22s ease-in-out infinite',
      }} />
  </div>
);

// ─── Animated Counter ───
const AnimatedCounter = ({ value, suffix = '' }: { value: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    }
  }, []);
  return <span ref={ref} className="inline-block">{value}{suffix}</span>;
};

export const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (heroRef.current) {
      const elements = heroRef.current.querySelectorAll('.hero-animate');
      gsap.fromTo(elements,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
      );
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-[#f0f4ff] overflow-x-hidden" onMouseMove={handleMouseMove}>
      <Starfield />
      <FloatingOrbs />

      {/* Inject orb animation keyframes */}
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 40px) scale(0.95); }
          75% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.08); }
          66% { transform: translate(30px, -40px) scale(0.93); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -50px) scale(1.12); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.04]"
        style={{ background: 'rgba(5, 10, 20, 0.7)', backdropFilter: 'blur(20px) saturate(1.5)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0af0ff] via-[#00b4d8] to-[#bf5af2] flex items-center justify-center shadow-[0_0_25px_rgba(10,240,255,0.25)]">
                <Shield className="w-4.5 h-4.5 text-[#050a14]" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-xl border border-[#0af0ff]/30" style={{ animation: 'pulse-ring 3s ease-out infinite' }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">Rapid Crisis</span>
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0af0ff]/15 to-[#bf5af2]/15 border border-[#0af0ff]/20 text-[#0af0ff] font-mono uppercase tracking-[0.15em] font-bold"
                style={{ animation: 'float-badge 3s ease-in-out infinite' }}>
                ✦ Command Grade
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/guest" className="hidden sm:flex items-center gap-1.5 text-[13px] text-[#8892b0] hover:text-[#0af0ff] transition-all px-4 py-2 font-mono rounded-lg hover:bg-white/[0.03]">
              <Radio className="w-3.5 h-3.5" /> Live Demo
            </Link>
            <Link to="/login" className="text-[13px] font-medium text-[#c8cee0] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-5 py-2 rounded-xl transition-all hover:border-white/[0.15]">
              Staff Login
            </Link>
            <Link to="/register" className="text-[13px] font-bold text-[#050a14] px-5 py-2 rounded-xl transition-all btn-command relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0af0ff, #00b4d8, #0af0ff)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 4s ease infinite',
                boxShadow: '0 0 25px rgba(10,240,255,0.2), 0 0 50px rgba(10,240,255,0.08)',
              }}>
              Get Started <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative pt-36 pb-28 px-6 lg:px-8 min-h-[90vh] flex items-center justify-center">
        <div className="relative max-w-5xl mx-auto text-center z-10"
          style={{ transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)` }}>

          {/* Badge */}
          <div className="hero-animate inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#0af0ff]/15 text-[#0af0ff] text-[11px] font-mono mb-10 tracking-[0.1em] uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(10,240,255,0.06), rgba(191,90,242,0.04))',
              boxShadow: '0 0 40px rgba(10,240,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
            <Sparkles className="w-3.5 h-3.5 text-[#bf5af2]" />
            AI-Powered Crisis Management for Hospitality
          </div>

          {/* Big Title */}
          <h1 className="hero-animate text-[4rem] sm:text-[5rem] lg:text-[6.5rem] font-black text-white tracking-[-0.03em] leading-[0.95] mb-8">
            <span className="block">Rapid Crisis</span>
            <span className="block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #0af0ff 0%, #bf5af2 40%, #ff2d55 70%, #ff9500 100%)',
                backgroundSize: '300% 100%',
                animation: 'gradient-shift 6s ease infinite',
                WebkitBackgroundClip: 'text',
              }}>
              Response Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-animate text-lg sm:text-xl text-[#7888a8] max-w-2xl mx-auto leading-relaxed mb-12">
            Real-time emergency detection, AI-powered threat scoring, and instant
            coordination — built for the most extreme environments on Earth.
          </p>

          {/* CTA Buttons */}
          <div className="hero-animate flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="group relative flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-[#050a14] transition-all overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0af0ff, #00d4e8, #0af0ff)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
                boxShadow: '0 0 30px rgba(10,240,255,0.25), 0 4px 20px rgba(0,0,0,0.3)',
              }}>
              <Shield className="w-4.5 h-4.5" />
              Deploy Command Center
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <Link to="/guest" className="flex items-center gap-2.5 px-9 py-4 text-[#8892b0] hover:text-white font-medium rounded-2xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
              <Radio className="w-4 h-4 group-hover:text-[#0af0ff] transition-colors" /> Try SOS Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative z-10 border-y border-white/[0.04]"
        style={{ background: 'rgba(5, 10, 20, 0.5)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { icon: Zap, value: '<50ms', label: 'Latency', color: '#0af0ff' },
            { icon: Sparkles, value: 'Gemini', label: 'AI Engine', color: '#bf5af2' },
            { icon: Lock, value: 'AES-256', label: 'Encryption', color: '#30d158' },
            { icon: Wifi, value: 'Live', label: 'WebSocket', color: '#ff9500' },
          ].map((stat, i) => (
            <div key={i} className="relative px-6 py-8 text-center group hover:bg-white/[0.02] transition-all cursor-default"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <stat.icon className="w-4 h-4 mx-auto mb-2 transition-transform group-hover:scale-110" style={{ color: stat.color }} />
              <div className="text-2xl font-black text-white mb-0.5 font-mono tracking-tight">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="text-[9px] text-[#4a5577] uppercase tracking-[0.25em] font-mono font-semibold">{stat.label}</div>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 50%, ${stat.color}06 0%, transparent 70%)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-28 px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] text-[#8892b0] uppercase tracking-[0.2em] font-mono mb-6">
              Platform Capabilities
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">Built for Mission-Critical</h2>
            <p className="text-[#7888a8] max-w-xl mx-auto text-lg">Every feature engineered for zero-latency crisis management across hotels, resorts, and hospitality networks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Zap, color: '#0af0ff', glow: 'rgba(10,240,255,0.06)', title: 'One-Click SOS', desc: 'Guests trigger emergency alerts instantly. Choose type, add details, and dispatch in seconds with a 10-second cancel window.' },
              { icon: Activity, color: '#ff2d55', glow: 'rgba(255,45,85,0.06)', title: 'AI Threat Scoring', desc: 'Google Gemini classifies severity (Critical/Medium/Low) and generates immediate action recommendations for each incident.' },
              { icon: MapPin, color: '#0af0ff', glow: 'rgba(10,240,255,0.06)', title: 'Live Geolocation', desc: 'Dark-mode map with severity-coded pulse markers. Real-time updates with smooth fly-to transitions on alert selection.' },
              { icon: MessageCircle, color: '#30d158', glow: 'rgba(48,209,88,0.06)', title: 'Real-Time Chat', desc: 'WebSocket-powered live chat between guests and staff. System-wide broadcast alerts for evacuations and critical notices.' },
              { icon: Bot, color: '#bf5af2', glow: 'rgba(191,90,242,0.06)', title: 'AI Assistant', desc: 'Gemini-powered chatbot provides instant guidance — fire safety, first aid, earthquake protocols — available 24/7.' },
              { icon: BarChart3, color: '#ff9500', glow: 'rgba(255,149,0,0.06)', title: 'Live Analytics', desc: 'Animated charts for incident trends, response times, and severity breakdown. AI-generated security audit recommendations.' },
            ].map((card, i) => (
              <div key={i} className="group relative rounded-2xl border border-white/[0.05] p-8 transition-all duration-500 hover:border-white/[0.1] overflow-hidden cursor-default"
                style={{ background: 'rgba(8, 14, 28, 0.5)', backdropFilter: 'blur(12px)' }}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 20%, ${card.glow} 0%, transparent 60%)` }} />
                {/* Top line accent */}
                <div className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${card.color}40, transparent)` }} />

                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: `${card.color}08`,
                      border: `1px solid ${card.color}15`,
                      boxShadow: `0 0 20px ${card.color}08`,
                    }}>
                    <card.icon className="w-5.5 h-5.5" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">{card.title}</h3>
                  <p className="text-[#7888a8] text-sm leading-relaxed mb-5">{card.desc}</p>
                  <div className="flex items-center text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1" style={{ color: card.color }}>
                    Explore <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-28 px-6 lg:px-8 relative z-10 border-t border-white/[0.04]"
        style={{ background: 'rgba(5, 10, 20, 0.3)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">How It Works</h2>
            <p className="text-[#7888a8] max-w-lg mx-auto text-lg">From trigger to coordinated response in under one second.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { step: '01', icon: Flame, color: '#ff2d55', title: 'Guest Triggers SOS', desc: 'Select emergency type, add room number and details. One-tap dispatch with 10s cancel window.' },
              { step: '02', icon: Activity, color: '#bf5af2', title: 'AI Scores Threat', desc: 'Gemini analyzes text and sensor data, assigns threat score (0-100), determines severity level.' },
              { step: '03', icon: Megaphone, color: '#ff9500', title: 'Staff Alerted', desc: 'Real-time WebSocket push to dispatch dashboard. Audio alert, map pin, and AI recommendations.' },
              { step: '04', icon: Globe, color: '#0af0ff', title: 'Response Coordinated', desc: 'Assign staff, track status pipeline, chat with guests, broadcast evacuation notices.' },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {/* Step number */}
                <div className="text-7xl font-black absolute -top-6 -left-2 font-mono opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">{item.step}</div>

                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-5 w-10 h-px"
                    style={{ background: `linear-gradient(90deg, ${item.color}30, transparent)` }} />
                )}

                <div className="relative pt-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                    style={{
                      background: `${item.color}08`,
                      border: `1px solid ${item.color}15`,
                    }}>
                    <item.icon className="w-5.5 h-5.5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-[#7888a8] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-28 px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Background glow */}
          <div className="absolute inset-0 -m-8 rounded-[2rem] opacity-40"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(10,240,255,0.06) 0%, rgba(191,90,242,0.04) 40%, transparent 70%)' }} />

          <div className="relative rounded-[2rem] border border-white/[0.06] p-14 md:p-20 text-center overflow-hidden"
            style={{ background: 'rgba(8, 14, 28, 0.6)', backdropFilter: 'blur(20px)' }}>
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-[#0af0ff]/15 rounded-tl-[2rem]" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-[#bf5af2]/15 rounded-br-[2rem]" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.06] text-[10px] text-[#8892b0] uppercase tracking-[0.2em] font-mono mb-8 bg-white/[0.02]">
              <Shield className="w-3 h-3 text-[#0af0ff]" /> Enterprise Ready
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">Ready to Protect<br />Your Property?</h2>
            <p className="text-[#7888a8] max-w-lg mx-auto mb-10 text-lg">Deploy an AI-powered crisis response hub in minutes. Real-time alerts, Gemini AI triage, live mapping, and coordinated response.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-[#050a14] transition-all btn-command relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #0af0ff, #00c8e0, #0af0ff)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
                boxShadow: '0 0 30px rgba(10,240,255,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}>
              Create Command Center <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 lg:px-8"
        style={{ background: 'rgba(5, 10, 20, 0.5)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#4a5577]" />
            <span className="text-[12px] text-[#4a5577] font-mono">Rapid Crisis Response — Hackathon 2026</span>
          </div>
          <div className="text-[12px] text-[#4a5577] font-mono">Django · React · WebSockets · Google Gemini AI</div>
        </div>
      </footer>
    </div>
  );
};
