import { useState, useRef, useEffect } from 'react';
import { useAlertStore } from '../store';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, User as UserIcon, Shield, Users } from 'lucide-react';
import gsap from 'gsap';
import type { UserRole } from '../store';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as UserRole) || 'customer';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAlertStore((state) => state.login);
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.access) {
        login(data.access, role);
        navigate(role === 'staff' ? '/admin' : '/customer');
      } else {
        setError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = role === 'staff';
  const accentColor = isStaff ? '#a78bfa' : '#0af0ff';
  const gradientFrom = isStaff ? '#a78bfa' : '#0af0ff';
  const gradientTo = isStaff ? '#7c3aed' : '#00b4d8';
  const RoleIcon = isStaff ? Shield : Users;
  const roleLabel = isStaff ? 'Staff' : 'Customer';

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: `${accentColor}08` }}
      />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#bf5af2]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <Link to="/login-select" className="fixed top-6 left-6 flex items-center gap-2 text-sm text-[#4a5577] hover:text-white transition-colors z-50 font-mono">
        <Shield className="w-4 h-4" /> CrisisResponse
      </Link>

      <div ref={formRef} className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              boxShadow: `0 0 30px ${accentColor}33`,
            }}
          >
            <RoleIcon className="w-7 h-7 text-[#060a13]" />
          </div>

          {/* Role Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 font-mono"
            style={{
              background: `${accentColor}10`,
              border: `1px solid ${accentColor}25`,
              color: accentColor,
            }}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            {roleLabel} Login
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-[#8892b0]">
            Sign in to access {isStaff ? 'the command center' : 'your customer portal'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="bg-[#ff2d55]/[0.06] border border-[#ff2d55]/15 text-[#ff2d55] p-3.5 rounded-xl mb-6 text-sm text-center font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5577]" />
                <input
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="Enter your username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5577]" />
                <input
                  required type="password"
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="Enter password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-[#060a13] font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2 btn-command"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                boxShadow: `0 0 20px ${accentColor}25`,
              }}
            >
              {loading ? 'Authenticating…' : `Sign In as ${roleLabel}`}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between mt-6 px-1">
          <Link to="/login-select" className="text-sm text-[#4a5577] hover:text-white transition-colors font-mono">
            ← Switch role
          </Link>
          {!isStaff && (
            <p className="text-[#4a5577] text-sm font-mono">
              No account? <Link to="/register" className="text-[#0af0ff] hover:text-[#0af0ff]/80 font-semibold">Create one</Link>
            </p>
          )}
          {isStaff && (
            <p className="text-[#4a5577] text-xs font-mono">
              Staff accounts are managed by admins
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
