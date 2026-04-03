import { Link } from 'react-router-dom';
import { Shield, Zap, MapPin, Activity, ChevronRight, Radio, Globe, ArrowRight } from 'lucide-react';

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
            <span className="text-lg font-bold tracking-tight text-white">CrisisResponse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/guest" className="hidden sm:flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors px-4 py-2">
              <Radio className="w-4 h-4" /> Live Demo
            </Link>
            <Link to="/login" className="text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-5 py-2 rounded-xl transition-all hover:border-white/[0.15]">
              Sign In
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
            Real-Time Event-Driven Architecture
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 animate-float-up" style={{animationDelay: '0.1s'}}>
            Decentralized Security
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Response Platform
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-10 animate-float-up" style={{animationDelay: '0.2s'}}>
            Real-time crisis management for remote hospitality properties. 
            WebSocket-powered alerts, AI threat scoring, and live geolocation — 
            all in sub-second response times.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-float-up" style={{animationDelay: '0.3s'}}>
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
            { value: '99.9%', label: 'Uptime SLA' },
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
            <p className="text-[#94a3b8] max-w-xl mx-auto">Every component engineered for zero-latency crisis management across decentralized property networks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sub-Second Telemetry</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">
                Persistent WebSocket channels push physical accelerometer data and SOS triggers directly to your dispatch console without HTTP polling overhead.
              </p>
              <div className="flex items-center text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-rose-500/30 hover:bg-rose-500/[0.03] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Threat Triage</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">
                ML-powered threat scoring engine instantly classifies and prioritizes incoming alerts. Highest-risk situations surface to the top of your queue automatically.
              </p>
              <div className="flex items-center text-rose-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-cyan-500/30 hover:bg-cyan-500/[0.03] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Geolocation</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">
                HTML5 Geolocation API captures precise coordinates on SOS trigger. Responders see exact guest positions on an interactive Leaflet map in real-time.
              </p>
              <div className="flex items-center text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6 lg:px-8 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-[#94a3b8] max-w-lg mx-auto">From trigger to response in under one second.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Radio className="w-6 h-6" />, title: 'Guest Triggers SOS', desc: 'A distressed guest taps the emergency button. Device sensors and GPS coordinates are captured instantly.' },
              { step: '02', icon: <Activity className="w-6 h-6" />, title: 'AI Scores Threat', desc: 'The backend ML engine analyzes sensor telemetry and assigns a dynamic threat score from 1 to 100.' },
              { step: '03', icon: <Globe className="w-6 h-6" />, title: 'Responders Dispatched', desc: 'Alert is broadcast via WebSocket to the dispatch console. Responders see the location, score, and context instantly.' },
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
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-3xl blur-xl" />
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Secure Your Properties?</h2>
            <p className="text-[#94a3b8] max-w-lg mx-auto mb-8">Deploy a crisis response hub in minutes. Real-time alerts, AI triage, and live mapping — all out of the box.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:scale-[1.02]">
              Create Security Hub <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#64748b]" />
            <span className="text-sm text-[#64748b]">CrisisResponse MVP — Hackathon Demo</span>
          </div>
          <div className="text-sm text-[#475569]">Built with Django Channels + React + WebSockets</div>
        </div>
      </footer>
    </div>
  );
};
