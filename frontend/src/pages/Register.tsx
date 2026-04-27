import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, UserPlus, User as UserIcon, Lock, Mail } from 'lucide-react';
import gsap from 'gsap';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login-select'), 2000);
      } else {
        const firstError = Object.values(data)?.[0];
        setError(Array.isArray(firstError) ? (firstError as string[])[0] : 'Registration failed.');
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#bf5af2]/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#0af0ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-sm text-[#4a5577] hover:text-white transition-colors z-50 font-mono">
        <Shield className="w-4 h-4" /> CrisisResponse
      </Link>

      <div ref={formRef} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#bf5af2] to-[#9745c7] flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(191,90,242,0.2)]">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Customer Account</h1>
          <p className="text-[#8892b0]">Register to report emergencies and track incidents</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="bg-[#ff2d55]/[0.06] border border-[#ff2d55]/15 text-[#ff2d55] p-3.5 rounded-xl mb-6 text-sm text-center font-mono">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[#30d158]/[0.06] border border-[#30d158]/15 text-[#30d158] p-3.5 rounded-xl mb-6 text-sm text-center font-mono">
              ✅ Account created! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">First Name</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="John"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Last Name</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="Doe"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5577]" />
                <input required className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="Choose a username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5577]" />
                <input type="email" className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="your@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#8892b0] mb-1.5 uppercase tracking-[0.2em] font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5577]" />
                <input required type="password" className="w-full bg-white/[0.03] border border-white/[0.06] text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577]"
                  placeholder="Min 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 btn-ai text-white font-bold rounded-xl btn-command disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-1"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[#4a5577] text-sm font-mono">
          Already have an account? <Link to="/login-select" className="text-[#bf5af2] hover:text-[#bf5af2]/80 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
