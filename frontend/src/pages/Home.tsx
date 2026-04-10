import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import './Home.css';
import {
  Shield, Zap, MapPin, Activity, Radio, ArrowRight,
  Flame, MessageCircle, BarChart3, Bot, Megaphone, Globe
} from 'lucide-react';

/* ───── Snowflake Particle Component ───── */
const SnowParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
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
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
};

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

  const featuresLeft = [
    { icon: Zap, title: 'One-Click SOS', desc: 'Guests trigger emergency alerts instantly with a 10-second cancel window.', color: '#22d3ee' },
    { icon: Activity, title: 'AI Threat Scoring', desc: 'Google Gemini classifies severity and generates action recommendations.', color: '#a78bfa' },
    { icon: MapPin, title: 'Live Geolocation', desc: 'Dark-themed map with severity-coded pulse markers and real-time updates.', color: '#34d399' },
  ];

  const featuresRight = [
    { icon: MessageCircle, title: 'Real-Time Chat', desc: 'WebSocket-powered live chat between guests and staff for rapid coordination.', color: '#38bdf8' },
    { icon: Bot, title: 'AI Emergency Assistant', desc: 'Gemini chatbot provides instant guidance — fire safety, first aid, earthquake protocols.', color: '#e879f9' },
    { icon: BarChart3, title: 'Analytics & Insights', desc: 'Incident frequency, response times, severity breakdown, and AI security audits.', color: '#fbbf24' },
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
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
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
            AI-Powered Crisis Management for Hospitality
          </div>

          <h1 className="hero-title animate-ice-in" style={{ animationDelay: '0.4s' }}>
            <span className="title-line-1">Rapid Crisis</span>
            <span className="title-line-2">Response Platform</span>
          </h1>

          <p className="hero-subtitle animate-ice-in" style={{ animationDelay: '0.6s' }}>
            Real-time emergency detection, AI-powered threat scoring, and instant
            coordination — built for the most extreme environments on Earth.
          </p>

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

      {/* ─── Features Section 1: Features Left + Doodle Right (Discord Style) ─── */}
      <section className="features-discord-section">
        <div className="discord-card" style={{ background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5), rgba(15, 23, 42, 0.8))' }}>
          {/* Features list on the left */}
          <div className="features-list-side">
            <div className="section-badge">CAPABILITIES</div>
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              With you throughout every crisis
            </h2>
            <div className="features-rows">
              {featuresLeft.map((f, i) => (
                <div key={i} className="feature-row">
                  <div className="feature-row-icon" style={{ background: f.color }}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="feature-row-title">{f.title}</span>
                    <span className="feature-row-desc"> {f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Big doodle on the right inside dark frame */}
          <div className="features-doodle-side discord-doodle">
            <div className="discord-image-frame">
              <div className="doodle-cloud" />
              <img
                src="/doodles/hero-crisis.png"
                alt="Crisis response coordinator"
                className="features-doodle-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section 2: Features Left + Doodle Right (Discord Style) ─── */}
      <section className="features-discord-section">
        <div className="discord-card" style={{ background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.5), rgba(5, 10, 20, 0.8))' }}>
          {/* Features list on the left */}
          <div className="features-list-side">
            <div className="section-badge">COORDINATION</div>
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Powerful tools for rapid response
            </h2>
            <div className="features-rows">
              {featuresRight.map((f, i) => (
                <div key={i} className="feature-row">
                  <div className="feature-row-icon" style={{ background: f.color }}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="feature-row-title">{f.title}</span>
                    <span className="feature-row-desc"> {f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doodle on the right inside dark frame */}
          <div className="features-doodle-side discord-doodle">
            <div className="discord-image-frame">
              <div className="doodle-cloud" />
              <img
                src="/doodles/dispatch.png"
                alt="Emergency dispatch coordinator"
                className="features-doodle-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="timeline-section">
        <div className="section-header">
          <div className="section-badge">
            PROCESS
          </div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-desc">From trigger to coordinated response in under one second.</p>
        </div>

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
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-frost-bg" />
          <div className="cta-aurora" />

          <div className="cta-content">
            <h2 className="cta-title">Ready to Protect Your Property?</h2>
            <p className="cta-desc">
              Deploy an AI-powered crisis response system built for the most demanding environments.
              Real-time alerts, Gemini AI triage, live mapping — all fortified like an arctic shelter.
            </p>
            <Link to="/register" className="cta-primary cta-primary-lg">
              <div className="cta-ice-shine" />
              Create Command Center
              <ArrowRight className="w-5 h-5 cta-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="igloo-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield className="w-4 h-4" />
            <span>Rapid Crisis Response — Hackathon Demo</span>
          </div>
          <div className="footer-tech">
            Django + React + WebSockets + Google Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
};
