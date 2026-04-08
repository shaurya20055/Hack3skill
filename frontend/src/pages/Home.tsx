import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import gsap from 'gsap';
import {
  Shield, Zap, MapPin, Activity, ChevronRight, Radio, ArrowRight,
  Flame, MessageCircle, BarChart3, Bot, Megaphone, Sparkles, Globe, Lock, Wifi
} from 'lucide-react';

// ─── Animated Starfield Canvas ───
const Starfield = () => {
=======
import { useEffect, useRef, useState } from 'react';
import './Home.css';
import {
  Shield, Zap, MapPin, Activity, ChevronRight, Radio, ArrowRight,
  Flame, MessageCircle, BarChart3, Bot, Megaphone, Globe,
  Snowflake, Mountain, Star
} from 'lucide-react';

/* ───── Snowflake Particle Component ───── */
const SnowParticles = () => {
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
<<<<<<< HEAD
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
=======
    const particles: { x: number; y: number; r: number; speed: number; wind: number; opacity: number; swing: number; swingSpeed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 0.8 + 0.2,
        wind: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.swing += p.swingSpeed;
        p.y += p.speed;
        p.x += p.wind + Math.sin(p.swing) * 0.3;

        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity})`;
        ctx.fill();

        // Tiny glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${p.opacity * 0.15})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
<<<<<<< HEAD
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
=======
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
    />
  );
};

<<<<<<< HEAD
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
=======
/* ───── 3D Igloo SVG Component ───── */
const Igloo3D = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setRotation((r) => (r + 0.15) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="igloo-scene" style={{ perspective: '1200px' }}>
      <div
        className="igloo-model"
        style={{ transform: `rotateY(${rotation}deg) rotateX(-8deg)` }}
      >
        {/* Igloo dome - built from CSS */}
        <div className="igloo-dome">
          {/* Ice blocks row pattern */}
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="igloo-ring"
              style={{
                '--row': row,
                '--total-rows': 5,
              } as React.CSSProperties}
            >
              {Array.from({ length: Math.max(3, 12 - row * 2) }).map((_, block) => (
                <div
                  key={block}
                  className="ice-block"
                  style={{
                    '--block': block,
                    '--total-blocks': Math.max(3, 12 - row * 2),
                    animationDelay: `${(row * 0.3 + block * 0.1)}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Entrance arch */}
        <div className="igloo-entrance" />

        {/* Warm glow from inside */}
        <div className="igloo-glow" />
      </div>

      {/* Ground snow */}
      <div className="snow-ground" />
    </div>
  );
};

/* ───── Aurora Borealis Effect ───── */
const AuroraBorealis = () => (
  <div className="aurora-container">
    <div className="aurora aurora-1" />
    <div className="aurora aurora-2" />
    <div className="aurora aurora-3" />
  </div>
);

/* ───── Main Home Component ───── */
export const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'One-Click SOS',
      desc: 'Guests trigger emergency alerts instantly. Choose type, add details, and dispatch in seconds with a 10-second cancel window.',
      gradient: 'from-cyan-400 to-blue-500',
      glowColor: 'rgba(34, 211, 238, 0.15)',
    },
    {
      icon: Activity,
      title: 'AI Threat Scoring',
      desc: 'Google Gemini-powered engine classifies severity and generates immediate action recommendations for each incident.',
      gradient: 'from-violet-400 to-purple-500',
      glowColor: 'rgba(167, 139, 250, 0.15)',
    },
    {
      icon: MapPin,
      title: 'Live Geolocation',
      desc: 'Dark-themed map shows all active incidents with GPS coordinates. Real-time marker updates as new alerts arrive.',
      gradient: 'from-emerald-400 to-teal-500',
      glowColor: 'rgba(52, 211, 153, 0.15)',
    },
    {
      icon: MessageCircle,
      title: 'Real-Time Chat',
      desc: 'WebSocket-powered live chat between guests and staff. System-wide broadcast for evacuations and critical alerts.',
      gradient: 'from-sky-400 to-indigo-500',
      glowColor: 'rgba(56, 189, 248, 0.15)',
    },
    {
      icon: Bot,
      title: 'AI Emergency Assistant',
      desc: 'Gemini chatbot provides instant guidance — fire safety, first aid, earthquake protocols — 24/7.',
      gradient: 'from-fuchsia-400 to-pink-500',
      glowColor: 'rgba(232, 121, 249, 0.15)',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      desc: 'Incident frequency, response times, severity breakdown, and AI-generated security audit reports.',
      gradient: 'from-amber-400 to-orange-500',
      glowColor: 'rgba(251, 191, 36, 0.15)',
    },
  ];

  const steps = [
    { step: '01', icon: Flame, title: 'Guest Triggers SOS', desc: 'Select emergency type, add room number and details. One-tap dispatch with 10s cancel window.' },
    { step: '02', icon: Activity, title: 'AI Scores Threat', desc: 'Gemini analyzes text and sensor data, assigns threat score (0-100), determines severity level.' },
    { step: '03', icon: Megaphone, title: 'Staff Alerted', desc: 'Real-time WebSocket push to dispatch dashboard. Audio alert, map pin, and AI recommendations.' },
    { step: '04', icon: Globe, title: 'Coordinated Response', desc: 'Assign staff, track status pipeline, chat with guests, broadcast evacuation notices.' },
  ];

  return (
    <div className="igloo-home">
      <SnowParticles />
      <AuroraBorealis />

      {/* ─── Navbar ─── */}
      <nav className={`igloo-nav ${scrollY > 50 ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="brand-text">Rapid Crisis</span>
            <div className="brand-badge">
              <Snowflake className="w-3 h-3" />
              ARCTIC GRADE
            </div>
          </div>
          <div className="nav-links">
            <Link to="/guest" className="nav-link">
              <Radio className="w-4 h-4" /> <span>Live Demo</span>
            </Link>
            <Link to="/login" className="nav-link-glass">
              Staff Login
            </Link>
            <Link to="/register" className="nav-link-cta">
              Get Started <ArrowRight className="w-4 h-4" />
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
<<<<<<< HEAD
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
=======
      <section className="hero-section">
        {/* Parallax mountain silhouettes */}
        <div
          className="hero-mountains"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <svg viewBox="0 0 1440 400" className="mountain-svg">
            <defs>
              <linearGradient id="mountainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a2744" />
                <stop offset="100%" stopColor="#0d1424" />
              </linearGradient>
              <linearGradient id="mountainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#152238" />
                <stop offset="100%" stopColor="#0b0f1a" />
              </linearGradient>
              <linearGradient id="snowCap" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c8daf0" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c8daf0" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Far mountains */}
            <path d="M0,400 L0,250 Q180,120 360,200 Q500,100 640,180 Q780,60 920,160 Q1060,80 1200,170 Q1340,100 1440,180 L1440,400 Z" fill="url(#mountainGrad1)" opacity="0.6" />
            {/* Near mountains */}
            <path d="M0,400 L0,300 Q120,200 280,280 Q400,180 560,260 Q680,150 840,240 Q980,160 1100,230 Q1240,180 1440,250 L1440,400 Z" fill="url(#mountainGrad2)" />
            {/* Snow caps */}
            <path d="M480,105 L500,100 L520,108 L510,112 L490,110 Z" fill="url(#snowCap)" />
            <path d="M770,65 L790,60 L810,70 L800,75 L780,72 Z" fill="url(#snowCap)" />
            <path d="M1050,85 L1070,80 L1090,88 L1080,92 L1060,90 Z" fill="url(#snowCap)" />
          </svg>
        </div>

        {/* Stars background */}
        <div className="stars-field">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
              }}
            />
          ))}
        </div>

        <div className="hero-content">
          {/* Floating 3D Igloo */}
          <div
            className="hero-igloo-wrapper"
            style={{
              transform: `translate(${(mousePos.x - 0.5) * 20}px, ${(mousePos.y - 0.5) * 10}px)`,
            }}
          >
            <Igloo3D />
          </div>

          {/* Badge */}
          <div className="hero-badge animate-ice-in" style={{ animationDelay: '0.2s' }}>
            <span className="badge-dot" />
            <Snowflake className="w-3.5 h-3.5" />
            AI-Powered Crisis Management for Hospitality
          </div>

          <h1 className="hero-title animate-ice-in" style={{ animationDelay: '0.4s' }}>
            <span className="title-line-1">Rapid Crisis</span>
            <span className="title-line-2">Response Platform</span>
          </h1>

          <p className="hero-subtitle animate-ice-in" style={{ animationDelay: '0.6s' }}>
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
            Real-time emergency detection, AI-powered threat scoring, and instant
            coordination — built for the most extreme environments on Earth.
          </p>

<<<<<<< HEAD
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
=======
          <div className="hero-actions animate-ice-in" style={{ animationDelay: '0.8s' }}>
            <Link to="/register" className="cta-primary">
              <div className="cta-ice-shine" />
              <Shield className="w-5 h-5" />
              Deploy Security Hub
              <ArrowRight className="w-4 h-4 cta-arrow" />
            </Link>
            <Link to="/guest" className="cta-secondary">
              <Radio className="w-4 h-4" />
              Try SOS Demo
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
            </Link>
          </div>

          {/* Floating stat orbs */}
          <div className="hero-orbs animate-ice-in" style={{ animationDelay: '1s' }}>
            {[
              { value: '<50ms', label: 'Latency', icon: Zap },
              { value: 'Gemini', label: 'AI Engine', icon: Activity },
              { value: 'AES-256', label: 'Encryption', icon: Shield },
              { value: 'Live', label: 'WebSocket', icon: Radio },
            ].map((orb, i) => (
              <div
                key={i}
                className="stat-orb"
                style={{ animationDelay: `${1 + i * 0.15}s` }}
              >
                <orb.icon className="w-4 h-4 orb-icon" />
                <div className="orb-value">{orb.value}</div>
                <div className="orb-label">{orb.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
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
=======
      {/* ─── Features Section ─── */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-badge">
            <Mountain className="w-4 h-4" />
            CAPABILITIES
          </div>
          <h2 className="section-title">Built for Mission-Critical Response</h2>
          <p className="section-desc">
            Every feature engineered for zero-latency crisis management across hotels, resorts, and remote stations.
          </p>
        </div>

        <div className="features-grid">
          {features.map((card, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                '--glow-color': card.glowColor,
                animationDelay: `${i * 0.1}s`,
              } as React.CSSProperties}
            >
              <div className="feature-card-frost" />
              <div className={`feature-icon bg-gradient-to-br ${card.gradient}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="feature-title">{card.title}</h3>
              <p className="feature-desc">{card.desc}</p>
              <div className="feature-link">
                Explore <ChevronRight className="w-4 h-4" />
              </div>
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
            </div>
          ))}
        </div>
      </section>

<<<<<<< HEAD
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
=======
      {/* ─── How It Works ─── */}
      <section className="timeline-section">
        <div className="section-header">
          <div className="section-badge">
            <Star className="w-4 h-4" />
            PROCESS
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
          </div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-desc">From trigger to coordinated response in under one second.</p>
        </div>

<<<<<<< HEAD
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
=======
        <div className="timeline-track">
          {/* Connecting ice beam */}
          <div className="timeline-beam" />

          {steps.map((item, i) => (
            <div
              key={i}
              className="timeline-node"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="node-number">{item.step}</div>
              <div className="node-crystal">
                <div className="crystal-inner">
                  <item.icon className="w-6 h-6" />
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
                </div>
                <div className="crystal-ring" />
                <div className="crystal-ring crystal-ring-2" />
              </div>
              <h3 className="node-title">{item.title}</h3>
              <p className="node-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
<<<<<<< HEAD
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
=======
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-frost-bg" />
          <div className="cta-aurora" />

          <div className="cta-content">
            <Snowflake className="w-10 h-10 text-cyan-300 mb-4 cta-snowflake" />
            <h2 className="cta-title">Ready to Protect Your Property?</h2>
            <p className="cta-desc">
              Deploy an AI-powered crisis response system built for the most demanding environments.
              Real-time alerts, Gemini AI triage, live mapping — all fortified like an arctic shelter.
            </p>
            <Link to="/register" className="cta-primary cta-primary-lg">
              <div className="cta-ice-shine" />
              Create Command Center
              <ArrowRight className="w-5 h-5 cta-arrow" />
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
<<<<<<< HEAD
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 lg:px-8"
        style={{ background: 'rgba(5, 10, 20, 0.5)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#4a5577]" />
            <span className="text-[12px] text-[#4a5577] font-mono">Rapid Crisis Response — Hackathon 2026</span>
          </div>
          <div className="text-[12px] text-[#4a5577] font-mono">Django · React · WebSockets · Google Gemini AI</div>
=======
      <footer className="igloo-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield className="w-4 h-4" />
            <span>Rapid Crisis Response — Hackathon Demo</span>
          </div>
          <div className="footer-tech">
            Django + React + WebSockets + Google Gemini AI
          </div>
>>>>>>> 649b48b590ad8302b9b9a11e12e48093fc6b5968
        </div>
      </footer>
    </div>
  );
};
