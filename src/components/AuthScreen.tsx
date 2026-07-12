import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onSuccess: (user: any, token: string) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password, role: isAdmin ? 'admin' : 'candidate' };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('auth_token', data.token);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An unknown network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Quick setup helper credentials
  const triggerDemoLogin = async (userType: 'candidate' | 'admin') => {
    setError(null);
    setLoading(true);
    const demoEmail = userType === 'candidate' ? 'praneetware@gmail.com' : 'admin@platform.com';
    const demoPass = userType === 'candidate' ? 'interview123' : 'admin123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      localStorage.setItem('auth_token', data.token);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative abstract blurs */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-violet-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            AI Interview Room
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immersive full-stack engineering interview training
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg mb-6 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 py-2.5 pl-10 pr-4 text-sm rounded-lg text-slate-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 py-2.5 pl-10 pr-4 text-sm rounded-lg text-slate-200 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 py-2.5 pl-10 pr-4 text-sm rounded-lg text-slate-200 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="admin-check"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-offset-0 focus:ring-indigo-500"
              />
              <label htmlFor="admin-check" className="text-xs text-slate-400 cursor-pointer select-none">
                Register as Platform Administrator
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 px-4 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                {isLogin ? 'Authenticating' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account?" : "Already possess account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer"
          >
            {isLogin ? 'Register now' : 'Login instead'}
          </button>
        </div>

        {/* Demo profiles entry panel */}
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
            Quick Launch Sandbox Logins
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => triggerDemoLogin('candidate')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer group"
            >
              <LogIn className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-indigo-200 font-medium font-sans">Praneet Singh</span>
              <span className="text-[9px] text-slate-500">Candidate Demo</span>
            </button>
            <button
              onClick={() => triggerDemoLogin('admin')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/35 hover:border-slate-700/80 rounded-xl transition-all cursor-pointer group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-200 font-medium font-sans font-medium">Administrator</span>
              <span className="text-[9px] text-slate-500">Admin Panel Access</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
