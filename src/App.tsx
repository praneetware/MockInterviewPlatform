import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, LogOut, FileText, BrainCircuit, BarChart, 
  Settings, UserCheck, Play, Award, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { User } from './types';
import AuthScreen from './components/AuthScreen';
import ResumeUpload from './components/ResumeUpload';
import InterviewRoom from './components/InterviewRoom';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminPanel from './components/AdminPanel';

type ActiveTab = 'practice' | 'resume' | 'analytics' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auto restore sessions from storage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Stale authorization token');
        })
        .then(data => {
          setUser(data.user);
          setToken(storedToken);
        })
        .catch(err => {
          console.log('Stale local session cleared:', err.message);
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleAuthSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setActiveTab('practice');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-350 flex flex-col items-center justify-center p-4">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse mb-3" />
        <p className="text-xs uppercase tracking-widest font-semibold font-mono">
          Authenticating Practice Lobby...
        </p>
      </div>
    );
  }

  // Auth gate
  if (!user || !token) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-immersive-bg text-zinc-100 flex flex-col relative overflow-x-hidden font-sans">
      
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 right-1/4 w-[40rem] h-[30rem] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[35rem] h-[30rem] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main App Bar header */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between shrink-0">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg italic shadow-glow-indigo text-white">
            A
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div>
            <h1 className="font-medium tracking-tight text-zinc-300 text-xs sm:text-sm uppercase font-sans flex items-center gap-2">
              AI Mock Interview <span className="text-zinc-500 hidden sm:inline">//</span> <span className="text-zinc-400 text-[10px] tracking-widest hidden sm:inline">ID: LOBBY-LIVE</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Navigation Tabs list */}
        <nav className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current text-transparent" />
            Interview Room
          </button>
          
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resume'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            CV Scanner
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart className="w-3.5 h-3.5" />
            My Analytics
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Admin
            </button>
          )}
        </nav>

        {/* Candidate / Admin Identity profile box */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-sans font-bold text-zinc-200 block">
              {user.name}
            </span>
            <span className={`text-[9px] uppercase tracking-wider font-semibold ${
              user.role === 'admin' ? 'text-emerald-400 font-mono tracking-widest' : 'text-indigo-400 font-mono'
            }`}>
              {user.role === 'admin' ? '// Administrator' : '// Engineering Candidate'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" title="Connection Active"></div>
            <button
              onClick={handleLogout}
              title="Settle exit connection"
              className="p-2 cursor-pointer bg-zinc-900/50 hover:bg-red-950/20 text-zinc-450 hover:text-red-400 rounded-lg border border-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </header>

      {/* Primary content area */}
      <main className="flex-grow p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'practice' && (
              <InterviewRoom token={token} onFinishSession={() => setActiveTab('analytics')} />
            )}
            
            {activeTab === 'resume' && (
              <ResumeUpload token={token} onParseComplete={() => setActiveTab('analytics')} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard token={token} />
            )}

            {activeTab === 'admin' && user.role === 'admin' && (
              <AdminPanel token={token} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Immersive status footer */}
      <footer className="h-8 bg-black/60 border-t border-white/5 flex items-center px-6 justify-between text-[10px] text-zinc-500 shrink-0 uppercase tracking-widest font-sans">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> AWS Hosted: us-east-1a</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Engine Core: Node v18 API</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Latency: 14ms</span>
          <span>Inbound Container Ingress Host Port: 3000</span>
        </div>
      </footer>

    </div>
  );
}
