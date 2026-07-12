import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  TrendingUp, Award, Clock, FileText, CheckCircle, ChevronDown, ChevronUp, 
  ExternalLink, Brain, BookOpen, AlertCircle, ArrowUpRight, Trophy 
} from 'lucide-react';
import { AnalyticsSummary, InterviewSession, ResumeSummary } from '../types';

interface AnalyticsDashboardProps {
  token: string;
}

export default function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [resume, setResume] = useState<ResumeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Expanded report state tracker
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [radarTab, setRadarTab] = useState<'competencies' | 'domains'>('domains');

  const fetchAnalyticsAndHistory = async () => {
    try {
      const res = await fetch('/api/interviews/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data.analytics);
      setSessions(data.sessions);

      // Dynamically fetch current parsed resume profile analysis 
      const resResume = await fetch('/api/resume/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resResume.ok) {
        const resumeData = await resResume.json();
        setResume(resumeData.resume);
      }
    } catch (err) {
      console.error('Error fetching analytics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsAndHistory();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Clock className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs uppercase tracking-wider font-semibold">Generating Analytics Models...</p>
      </div>
    );
  }

  // Fallback check if user hasn't completed any sessions
  const hasCompletedSession = sessions.some(s => s.status === 'completed' && s.feedback);

  // Competencies Radar comparison
  const competenciesRadarData = analytics ? [
    { name: 'Communication', Candidate: analytics.categoryAverages.communication, Target: 90, Gap: Math.max(0, 90 - analytics.categoryAverages.communication) },
    { name: 'System Design', Candidate: analytics.categoryAverages.technical, Target: 90, Gap: Math.max(0, 90 - analytics.categoryAverages.technical) },
    { name: 'Problem Coding', Candidate: analytics.categoryAverages.problemCoding, Target: 95, Gap: Math.max(0, 95 - analytics.categoryAverages.problemCoding) },
    { name: 'STAR Leadership', Candidate: analytics.categoryAverages.leadership, Target: 85, Gap: Math.max(0, 85 - analytics.categoryAverages.leadership) },
  ] : [];

  // Dynamic domains skill gap analysis
  const getTechnicalDomainsData = () => {
    const baseComm = analytics?.categoryAverages.communication || 75;
    const baseTech = analytics?.categoryAverages.technical || 78;
    const baseCode = analytics?.categoryAverages.problemCoding || 72;
    const baseLead = analytics?.categoryAverages.leadership || 80;
    
    const completed = sessions.filter(s => s.status === 'completed' && s.feedback);
    
    // Compute helper to average out category attributes from matching session titles
    const getAvg = (keywords: string[], feedbackKey: 'communication' | 'technical' | 'problemCoding' | 'leadership', defaultVal: number) => {
      const match = completed.filter(s => 
        keywords.some(kw => s.title.toLowerCase().includes(kw) || s.role.toLowerCase().includes(kw))
      );
      if (match.length > 0) {
        return Math.round(match.reduce((sum, s) => sum + (s.feedback?.categories[feedbackKey] || 0), 0) / match.length);
      }
      return defaultVal;
    };

    // Calculate domain scores based on AI feedback from completed interview sessions
    const sysDesignScore = getAvg(['design', 'system', 'architecture'], 'technical', baseTech);
    const frontendScore = getAvg(['frontend', 'react', 'client', 'ux'], 'technical', Math.round((baseTech * 0.8) + (baseComm * 0.2)));
    const backendScore = getAvg(['backend', 'node', 'server', 'database'], 'technical', baseTech);
    const algorithmsScore = baseCode;
    const starBehavioral = getAvg(['behavioral', 'star', 'leadership', 'excellence'], 'leadership', baseLead);
    const apiDevScore = getAvg(['node', 'backend', 'server', 'design'], 'problemCoding', Math.round((baseTech * 0.7) + (baseCode * 0.3)));

    return [
      { name: 'Sys Design', Candidate: sysDesignScore, Target: 90, Gap: Math.max(0, 90 - sysDesignScore) },
      { name: 'Frontend React', Candidate: frontendScore, Target: 85, Gap: Math.max(0, 85 - frontendScore) },
      { name: 'Backend Scaling', Candidate: backendScore, Target: 90, Gap: Math.max(0, 90 - backendScore) },
      { name: 'Coding & Logic', Candidate: algorithmsScore, Target: 95, Gap: Math.max(0, 95 - algorithmsScore) },
      { name: 'Behavior STAR', Candidate: starBehavioral, Target: 85, Gap: Math.max(0, 85 - starBehavioral) },
      { name: 'API Services', Candidate: apiDevScore, Target: 90, Gap: Math.max(0, 90 - apiDevScore) },
    ];
  };

  const domainsRadarData = getTechnicalDomainsData();
  const activeRadarData = radarTab === 'competencies' ? competenciesRadarData : domainsRadarData;

  // Sort score history chronological (oldest to newest) to display trends properly
  const chronologicalScoreHistory = analytics?.scoreHistory && [...analytics.scoreHistory].reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Interview Analytics Diagnostic Portfolio <TrendingUp className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-zinc-400 font-sans">
            Review detailed metrics, historic progression markers, and category breakdown averages compiled from your tech interview sessions and resume analysis.
          </p>
        </div>
        <button
          onClick={fetchAnalyticsAndHistory}
          className="text-[10px] font-sans font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 px-3.5 py-1.5 bg-indigo-950/20 border border-indigo-500/15 rounded-lg hover:bg-indigo-950/40 transition-all pointer-events-auto cursor-pointer shadow-glow-indigo"
        >
          Refresh Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN LEFT: Interview Outcomes & Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {!hasCompletedSession ? (
            <div className="border border-dashed border-white/5 rounded-2xl p-10 text-center bg-zinc-950/20 space-y-4 backdrop-blur-md">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto animate-bounce" />
              <h3 className="font-bold text-zinc-200 text-xs sm:text-sm uppercase tracking-wider font-mono">Awaiting your first practice scorecard</h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-md mx-auto font-sans">
                No completed assessments are logged yet. Venture into the <span className="text-indigo-400 font-semibold font-sans">Interview Room</span>, select a syllabus, and finish a session. SARA will automatically compile your performance charts and transcripts here.
              </p>
            </div>
          ) : (
            <>
              {/* Diagnostic Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* KPI 1 */}
                <div className="bg-immersive-card border border-immersive p-4 rounded-xl flex items-center gap-4 backdrop-blur-md shadow-sm">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Interviews Settled</span>
                    <p className="font-mono text-xl font-bold text-zinc-100">{analytics?.totalInterviews}</p>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-immersive-card border border-immersive p-4 rounded-xl flex items-center gap-4 backdrop-blur-md shadow-sm">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Weighted Avg Score</span>
                    <p className="font-mono text-xl font-bold text-zinc-100">
                      {analytics?.averageScore}
                      <span className="text-xs text-zinc-500">/100</span>
                    </p>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-immersive-card border border-immersive p-4 rounded-xl flex items-center gap-4 sm:col-span-2 md:col-span-1 backdrop-blur-md shadow-sm">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Peak Focus Rank</span>
                    <p className="text-[10px] text-zinc-300 font-sans leading-tight truncate">
                      <span className="text-emerald-400 font-bold">
                        {(() => {
                          if (!analytics) return 'None';
                          const avgs = analytics.categoryAverages;
                          const maxEntry = Object.entries(avgs).reduce((a, b) => a[1] > b[1] ? a : b);
                          const labels: Record<string, string> = {
                            communication: 'Communication',
                            technical: 'System Architecture',
                            problemCoding: 'Problem Solving',
                            leadership: 'Behavioral STAR'
                          };
                          return labels[maxEntry[0]] || 'Standard';
                        })()}
                      </span>
                    </p>
                  </div>
                </div>

              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Score History line */}
                <div className="bg-immersive-card border border-immersive rounded-xl p-4.5 space-y-3.5 backdrop-blur-md font-sans">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider font-mono">Progression Trend</h3>
                    <span className="text-[8px] font-mono text-zinc-500">Oldest → Newest chronologically</span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chronologicalScoreHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} />
                        <YAxis domain={[0, 100]} stroke="#52525b" fontSize={9} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#818cf8', fontSize: '11px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          name="Weighted Score"
                          stroke="#6366f1" 
                          strokeWidth={2} 
                          dot={{ fill: '#4f46e5', stroke: '#818cf8', strokeWidth: 1 }}
                          activeDot={{ r: 5 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar parameters grid */}
                <div className="bg-immersive-card border border-immersive rounded-xl p-5 space-y-4 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider font-mono">Skill Gaps Diagnosis</h3>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Profile criteria vs. target proficiency</p>
                    </div>
                    
                    {/* Active toggle switch */}
                    <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                      <button
                        onClick={() => setRadarTab('domains')}
                        className={`text-[9.5px] font-mono tracking-wider px-2 py-1 rounded-md transition-all ${
                          radarTab === 'domains'
                            ? 'bg-indigo-600 font-bold text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Tech Domains
                      </button>
                      <button
                        onClick={() => setRadarTab('competencies')}
                        className={`text-[9.5px] font-mono tracking-wider px-2 py-1 rounded-md transition-all ${
                          radarTab === 'competencies'
                            ? 'bg-indigo-600 font-bold text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Core Rubric
                      </button>
                    </div>
                  </div>

                  <div className="h-52 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activeRadarData}>
                        <PolarGrid stroke="#1c1c1f" />
                        <PolarAngleAxis dataKey="name" stroke="#a1a1aa" fontSize={8} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3f3f46" fontSize={8} />
                        
                        {/* Target Standard/Benchmark Radar layer */}
                        <Radar 
                          name="Target Mastery" 
                          dataKey="Target" 
                          stroke="#f59e0b" 
                          fill="#f59e0b" 
                          fillOpacity={0.02} 
                          strokeDasharray="4 4"
                        />
                        
                        {/* Selected proficiency rating */}
                        <Radar 
                          name="Your Score" 
                          dataKey="Candidate" 
                          stroke="#818cf8" 
                          fill="#818cf8" 
                          fillOpacity={0.15} 
                        />

                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const candidate = data.Candidate;
                              const target = data.Target;
                              const gap = data.Gap;
                              return (
                                <div className="bg-zinc-950 border border-white/10 p-3 rounded-xl shadow-xl space-y-1.5 font-sans z-50 text-[11px]">
                                  <p className="font-bold text-zinc-100 uppercase tracking-widest text-[9px] font-mono border-b border-white/5 pb-1">{data.name}</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <span className="text-zinc-500">Your Average:</span>
                                    <span className="font-mono font-bold text-indigo-400 text-right">{candidate}%</span>
                                    <span className="text-zinc-500">Target Standard:</span>
                                    <span className="font-mono font-bold text-amber-400 text-right">{target}%</span>
                                    <span className="text-zinc-400 font-medium border-t border-white/5 mt-1 pt-1">Skill Gap:</span>
                                    <span className={`font-mono font-bold text-right border-t border-white/5 mt-1 pt-1 ${gap > 10 ? 'text-rose-400' : gap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {gap > 0 ? `-${gap}%` : 'Mastered'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Diagnostic Gaps breakdown list */}
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      <span>{radarTab === 'domains' ? 'Technical Competency Domain' : 'Core Evaluation Category'}</span>
                      <span>Relative Gap Matrix</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {activeRadarData.map((d, i) => {
                        const gapPct = d.Gap;
                        return (
                          <div 
                            key={i} 
                            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all"
                          >
                            <span className="font-medium text-zinc-300 font-sans text-[11px]">{d.name}</span>
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] text-zinc-500">
                                {d.Candidate}% <span className="text-zinc-700">/</span> {d.Target}%
                              </span>
                              {gapPct > 0 ? (
                                <span className={`text-[10px] font-mono font-semibold py-0.5 px-1.5 rounded border ${
                                  gapPct > 10 
                                    ? 'text-rose-450 bg-rose-500/5 border-rose-500/10' 
                                    : 'text-amber-400 bg-amber-500/5 border-amber-500/10'
                                }`}>
                                  -{gapPct}% gap
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-semibold text-emerald-400 py-0.5 px-1.5 bg-emerald-500/5 rounded border border-emerald-500/10">
                                  Mastered
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Historical Round Sessions List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider font-mono font-bold">Detailed Performance Transcripts</h3>

                <div className="space-y-3 font-sans">
                  {[...sessions]
                    .filter(s => s.status === 'completed' && s.feedback)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((session) => {
                      const isOpen = expandedSessionId === session.id;
                      const f = session.feedback!;
                      
                      return (
                        <div 
                          key={session.id}
                          className="border border-immersive rounded-xl bg-[#0a0a0c]/50 overflow-hidden transition-all duration-300 backdrop-blur-md"
                        >
                          <div 
                            onClick={() => setExpandedSessionId(isOpen ? null : session.id)}
                            className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-950 border border-white/5 rounded-lg text-indigo-400 font-sans">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-200 text-xs sm:text-sm font-sans">{session.role}</h4>
                                <span className="text-[9px] text-zinc-500 font-sans block mt-0.5 font-mono">
                                  ATTEMPTED ON: {new Date(session.createdAt).toLocaleDateString(undefined, { 
                                    year: 'numeric', month: 'short', day: 'numeric' 
                                  }).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-950 border border-white/5 py-1 px-2.5 rounded-lg text-center min-w-[50px]">
                                <span className="text-[12px] font-mono font-bold text-indigo-400">{f.overallScore}</span>
                                <span className="text-[7px] uppercase tracking-wider text-zinc-500 font-mono block">Score</span>
                              </div>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                            </div>
                          </div>

                          {isOpen && (
                            <div className="border-t border-white/5 p-5 bg-zinc-950/20 space-y-5 animate-fade-in font-sans">
                              
                              <div className="space-y-1.5">
                                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">Overall Evaluation Synopsis:</span>
                                <p className="text-xs text-zinc-300 leading-relaxed bg-[#0c0c0e] p-3.5 rounded-xl border border-white/5 font-sans">
                                  {f.overallSummary}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-zinc-950/60 border border-white/5 py-2.5 px-3 rounded-lg text-center">
                                  <span className="text-[14px] font-mono font-bold text-indigo-300">{f.categories?.communication || 0}%</span>
                                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block mt-0.5 font-sans">Communication</span>
                                </div>
                                <div className="bg-zinc-950/60 border border-white/5 py-2.5 px-3 rounded-lg text-center">
                                  <span className="text-[14px] font-mono font-bold text-violet-300">{f.categories?.technical || 0}%</span>
                                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block mt-0.5 font-sans">Tech Depth</span>
                                </div>
                                <div className="bg-zinc-950/60 border border-white/5 py-2.5 px-3 rounded-lg text-center">
                                  <span className="text-[14px] font-mono font-bold text-emerald-300">{f.categories?.problemCoding || 0}%</span>
                                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block mt-0.5 font-sans">Program Logic</span>
                                </div>
                                <div className="bg-zinc-950/60 border border-white/5 py-2.5 px-3 rounded-lg text-center">
                                  <span className="text-[14px] font-mono font-bold text-amber-300">{f.categories?.leadership || 0}%</span>
                                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block mt-0.5 font-sans">STAR Leadership</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-lg space-y-2.5">
                                  <h6 className="font-bold text-[10px] uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 font-sans">
                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-450" /> Prominent Strengths
                                  </h6>
                                  <ul className="space-y-1.5">
                                    {f.strengths.map((str, idx) => (
                                      <li key={idx} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-1.5 font-sans">
                                        <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                        <span>{str}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-[#0e0e11] border border-white/5 p-4 rounded-lg space-y-2.5">
                                  <h6 className="font-bold text-[10px] uppercase tracking-wider text-rose-350 flex items-center gap-1.5 font-sans">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-450" /> Improvement Targets
                                  </h6>
                                  <ul className="space-y-1.5">
                                    {f.weaknesses.map((weak, idx) => (
                                      <li key={idx} className="text-xs text-zinc-350 leading-relaxed flex items-start gap-1.5 font-sans">
                                        <span className="text-rose-450 font-bold mt-0.5">•</span>
                                        <span>{weak}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="space-y-3 pt-3 border-t border-white/5">
                                <h6 className="font-bold text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Step-by-Step Questions Critique</h6>
                                <div className="space-y-3 font-sans">
                                  {f.questionsFeedback.map((qf, i) => (
                                    <div key={i} className="bg-zinc-950/40 border border-white/5 p-3 rounded-lg space-y-2.5 font-sans">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-0.5 max-w-[85%] font-sans">
                                          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Question {i + 1}:</span>
                                          <h5 className="font-bold text-zinc-300 text-xs font-sans leading-normal">{qf.question}</h5>
                                        </div>
                                        <div className="bg-zinc-950 px-1.5 py-0.5 rounded border border-white/5 text-center min-w-[35px]">
                                          <span className="font-mono text-[10px] font-bold text-indigo-400">{qf.score}</span>
                                          <span className="text-[6px] text-zinc-500 block uppercase font-mono">Rating</span>
                                        </div>
                                      </div>

                                      <div className="space-y-0.5 pl-2 border-l border-white/5 ml-1 font-sans">
                                        <span className="text-[8px] text-indigo-350 tracking-wider block uppercase font-mono font-bold font-semibold">Answer Snapshot:</span>
                                        <p className="text-xs text-zinc-400 leading-normal font-sans italic">
                                          "{qf.answer || '(Empty response or shared coding solution)'}"
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/80 p-2.5 rounded-lg border border-immersive">
                                        <div className="space-y-0.5 font-sans">
                                          <span className="text-[8px] uppercase tracking-wider text-indigo-400 font-bold block font-mono">Critique Assessment:</span>
                                          <p className="text-xs text-zinc-400 leading-normal font-sans">
                                            {qf.critique}
                                          </p>
                                        </div>
                                        <div className="space-y-0.5 font-sans">
                                          <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold block font-mono">AI Suggestion:</span>
                                          <p className="text-xs text-zinc-400 leading-normal font-sans">
                                            {qf.suggestion}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* COLUMN RIGHT: CV Scanner Profile Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-immersive-card border border-immersive p-5 rounded-2xl space-y-5 backdrop-blur-md shadow-lg font-sans">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Brain className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-200 text-xs uppercase tracking-wider font-mono">
                  CV Profile Analysis
                </h3>
                <p className="text-[9px] text-[#818cf8]/80 font-mono mt-0.5 uppercase">
                  Synchronized Tech Parameters
                </p>
              </div>
            </div>

            {resume ? (
              <div className="space-y-4 font-sans text-zinc-300">
                
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                    Experience Synopsis:
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-white/5 font-sans">
                    {resume.experience}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                    Tailored Career Targets:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resume.suggestedRoles.map((role, idx) => (
                      <span 
                        key={idx}
                        className="text-[9px] font-mono tracking-wide px-2 py-0.5 bg-[#0e0e11] border border-white/5 hover:border-indigo-500/20 text-zinc-400 rounded-md font-semibold transition-colors"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                    Extracted Skill Map:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {resume.skills.map((skill, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 bg-indigo-950/30 border border-indigo-500/10 text-indigo-300 text-[10px] rounded-md font-sans font-medium hover:border-indigo-500/30 transition-all cursor-default"
                        title={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-1">
                  
                  <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-lg space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold font-mono flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Core Strengths
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300">
                      {resume.strengths.slice(0, 3).map((sStr, idx) => (
                        <li key={idx} className="flex items-start gap-1 leading-relaxed font-sans">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{sStr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-lg space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold font-mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Relative Gaps
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300">
                      {resume.gaps.slice(0, 3).map((gStr, idx) => (
                        <li key={idx} className="flex items-start gap-1 leading-relaxed font-sans">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{gStr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {resume.education && (
                  <div className="space-y-1 border-t border-white/5 pt-3">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                      Education Summary:
                    </span>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {resume.education}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center p-3 py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20 space-y-2.5">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto" />
                <h4 className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider font-mono">
                  Awaiting profile assessment
                </h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed font-sans max-w-xs mx-auto">
                  Submit CV plain text under the <span className="text-indigo-400 font-semibold font-sans">CV Scanner</span> tab. SARA AI will map your engineering criteria vectors and synchronize results in this dashboard immediately.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
