import { Link } from 'react-router-dom';
import {
  Shield, Zap, MapPin, Activity, ChevronRight, Radio, Globe, ArrowRight,
  Flame, HeartPulse, MessageCircle, BarChart3, Bot, Megaphone
} from 'lucide-react';

export const Home = () => {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#e2e8f0] overflow-x-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Rapid Crisis Response</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/guest" className="hidden sm:flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors px-4 py-2">
              <Radio className="w-4 h-4" /> Live Demo
            </Link>
            <Link to="/login" className="text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-5 py-2 rounded-xl transition-all hover:border-white/[0.15]">
              Staff Login
            </Link>
            <Link to="/register" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8">
        {/* Ambient glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/[0.08] rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple-600/[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/[0.1] border border-indigo-500/[0.2] text-indigo-300 text-xs font-medium mb-8 animate-float-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Crisis Management for Hospitality
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 animate-float-up" style={{ animationDelay: '0.1s' }}>
            Rapid Crisis
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">
              Response Platform
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-10 animate-float-up" style={{ animationDelay: '0.2s' }}>
            Real-time emergency detection, AI-powered threat scoring, and instant
            coordination between guests, staff, and emergency services —
            all in sub-second response times.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-float-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="group flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]">
              Deploy Security Hub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/guest" className="flex items-center gap-2 px-8 py-3.5 text-[#94a3b8] hover:text-white font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <Radio className="w-4 h-4" /> Try SOS Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
          {[
            { value: '<50ms', label: 'Alert Latency' },
            { value: 'Gemini AI', label: 'Threat Scoring' },
            { value: 'AES-256', label: 'Encryption' },
            { value: 'Real-Time', label: 'WebSocket Sync' },
          ].map((stat, i) => (
            <div key={i} className="px-6 py-8 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-[#64748b] uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for Mission-Critical Response</h2>
            <p className="text-[#94a3b8] max-w-xl mx-auto">Every feature engineered for zero-latency crisis management across hotels, resorts, and hospitality networks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature Cards */}
            {[
              {
                icon: Zap, color: 'indigo',
                title: 'One-Click SOS',
                desc: 'Guests trigger emergency alerts instantly. Choose type (fire, medical, security), add details, and dispatch in seconds with a 10-second cancel window.',
              },
              {
                icon: Activity, color: 'rose',
                title: 'AI Threat Scoring',
                desc: 'Google Gemini-powered engine classifies severity (Critical/Medium/Low) and generates immediate action recommendations for each incident.',
              },
              {
                icon: MapPin, color: 'cyan',
                title: 'Live Geolocation Map',
                desc: 'Leaflet-powered dark map shows all active incidents with GPS coordinates. Real-time marker updates as new alerts arrive.',
              },
              {
                icon: MessageCircle, color: 'emerald',
                title: 'Real-Time Chat',
                desc: 'WebSocket-powered live chat between guests and staff. System-wide broadcast alerts for evacuations and critical notices.',
              },
              {
                icon: Bot, color: 'purple',
                title: 'AI Emergency Assistant',
                desc: 'Gemini-powered chatbot provides instant guidance — fire safety, first aid, earthquake protocols — available to guests and staff 24/7.',
              },
              {
                icon: BarChart3, color: 'amber',
                title: 'Analytics & Insights',
                desc: 'Incident frequency, response times, severity breakdown, and AI-generated recommendations. Visual reports for security audits.',
              },
            ].map((card, i) => (
              <div key={i} className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-${card.color}-500/30 hover:bg-${card.color}-500/[0.03] transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/20 text-${card.color}-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">{card.desc}</p>
                <div className={`flex items-center text-${card.color}-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6 lg:px-8 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-[#94a3b8] max-w-lg mx-auto">From trigger to coordinated response in under one second.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: <Flame className="w-6 h-6" />, title: 'Guest Triggers SOS', desc: 'Select emergency type, add room number and details. One-tap dispatch with 10s cancel window.' },
              { step: '02', icon: <Activity className="w-6 h-6" />, title: 'AI Scores Threat', desc: 'Gemini analyzes text and sensor data, assigns threat score (0-100), determines severity level.' },
              { step: '03', icon: <Megaphone className="w-6 h-6" />, title: 'Staff Alerted', desc: 'Real-time WebSocket push to dispatch dashboard. Audio alert, map pin, and AI recommendations.' },
              { step: '04', icon: <Globe className="w-6 h-6" />, title: 'Coordinated Response', desc: 'Assign staff, track status pipeline, chat with guests, broadcast evacuation notices.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-white/[0.03] absolute -top-4 -left-2">{item.step}</div>
                <div className="relative pt-6">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-3xl blur-xl" />
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Protect Your Property?</h2>
            <p className="text-[#94a3b8] max-w-lg mx-auto mb-8">Deploy an AI-powered crisis response hub in minutes. Real-time alerts, Gemini AI triage, live mapping, and coordinated response — all out of the box.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:scale-[1.02]">
              Create Command Center <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#64748b]" />
            <span className="text-sm text-[#64748b]">Rapid Crisis Response — Hackathon Demo</span>
          </div>
          <div className="text-sm text-[#475569]">Django + React + WebSockets + Google Gemini AI</div>
        </div>
      </footer>
    </div>
  );
};
