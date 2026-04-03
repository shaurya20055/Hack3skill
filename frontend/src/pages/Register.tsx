import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User as UserIcon, Mail, Lock } from 'lucide-react';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (res.ok || res.status === 201) {
        navigate('/login');
      } else {
        const data = await res.json();
        const msg = Object.values(data).flat().join(' ');
        setError(msg || 'Registration failed.');
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/[0.05] rounded-full blur-[100px] pointer-events-none" />
      
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition-colors z-50">
        <Shield className="w-4 h-4" /> CrisisResponse
      </Link>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create your hub</h1>
          <p className="text-[#64748b]">Deploy a new dispatch control center</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8">
          {error && (
            <div className="bg-red-500/[0.08] border border-red-500/20 text-red-300 p-3.5 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  required
                  className="w-full bg-[#0b0f1a] border border-white/[0.08] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-[#334155]"
                  placeholder="Choose a username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  required type="email"
                  className="w-full bg-[#0b0f1a] border border-white/[0.08] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-[#334155]"
                  placeholder="org@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  required type="password" minLength={8}
                  className="w-full bg-[#0b0f1a] border border-white/[0.08] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-[#334155]"
                  placeholder="Min 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-600/20 text-sm mt-2"
            >
              {loading ? 'Provisioning…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[#475569] text-sm">
          Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
