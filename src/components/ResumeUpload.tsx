import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, BrainCircuit, CheckCircle2, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { ResumeSummary } from '../types';

interface ResumeUploadProps {
  token: string;
  onParseComplete: (resume: ResumeSummary) => void;
}

export default function ResumeUpload({ token, onParseComplete }: ResumeUploadProps) {
  const [resumeText, setResumeText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ResumeSummary | null>(null);

  // Fetch current resume on mounting if it exists
  useEffect(() => {
    let active = true;
    const fetchCurrentResume = async () => {
      try {
        const res = await fetch('/api/resume/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (active && data.resume) {
          setParsedResult(data.resume); // just populate the local view, don't navigate away
        }
      } catch (err) {
        console.error('Quietly bypass loading existing resume:', err);
      }
    };
    fetchCurrentResume();
    return () => { active = false; };
  }, [token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Simulated plain text parsing representation or loading
  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.json')) {
      setError('Standard preview files should be plain text format (.txt, .md). Paste your resume text directly below for best immediate results!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        setResumeText(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const submitResumeForAIAnalysis = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 20) {
      setError('Please provide or paste a functional resume (at least 20 characters) first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error parsing CV contents');
      }

      setParsedResult(data);
      onParseComplete(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during resume evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Introduction text */}
      <div className="bg-immersive-card border border-immersive p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-400">
          <BrainCircuit className="w-24 h-24" />
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Deep Gemini Resume Profiler <Sparkles className="w-4 h-4 text-indigo-400" />
            </h2>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              Upload your engineering resume to allow Gemini to build a fully customized diagnostic roadmap. Our AI will analyze your core developer parameters, pinpoint technical expertise tags, isolate relative skill gaps, and custom tailoring upcoming interview questions specifically to test your core strengths and weaknesses.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload panel (column span 5) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-immersive-card border border-immersive p-5 rounded-2xl space-y-4">
            <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider font-mono">
              Submit Candidate CV
            </h3>

            {/* Drag and Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-indigo-400 bg-indigo-950/20' 
                  : 'border-white/5 hover:border-zinc-700/80 bg-zinc-950/20'
              }`}
            >
              <input
                type="file"
                id="resume-file-input"
                className="hidden"
                accept=".txt,.md,.json"
                onChange={handleFileInput}
              />
              <label htmlFor="resume-file-input" className="cursor-pointer block space-y-2 select-none">
                <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto" />
                <div className="text-zinc-300 text-xs font-semibold">
                  Drag & Drop Resume text file
                </div>
                <div className="text-zinc-500 text-[10px] font-mono">
                  SUPPORTS PLAIN TEXT (.TXT, .MD)
                </div>
                <div className="inline-block text-xs text-indigo-400 hover:text-indigo-300 underline font-medium pt-1">
                  Or select local file
                </div>
              </label>
            </div>

            {/* Paste box label */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-zinc-500 text-[9px] uppercase tracking-widest font-mono font-bold">OR</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Rich text area */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Paste CV Plain Text Directly:
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste professional summary, experience history, skills, achievements, or academic credentials here..."
                rows={10}
                className="w-full bg-zinc-950 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-lg p-3 text-xs text-zinc-300 outline-none transition-all placeholder:text-zinc-700 font-sans leading-relaxed resize-y"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-500/10 text-red-300 text-xs rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            <button
              onClick={submitResumeForAIAnalysis}
              disabled={loading || !resumeText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 px-4 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shadow-glow-indigo"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  Gemini Model Parsing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Process & Analyze CV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results assessment details (col span 7) */}
        <div className="md:col-span-7">
          {parsedResult ? (
            <div className="bg-immersive-card border border-immersive rounded-2xl p-6 space-y-6 backdrop-blur-md">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 font-sans">Resume Diagnostics Ready</h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> // SYNCHRONIZED WITH INTERVIEW ENGINE
                  </p>
                </div>
              </div>

              {/* Total Summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono">
                  Professional Experience Synopsis:
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-950/40 p-3 rounded-lg border border-white/5">
                  {parsedResult.experience}
                </p>
              </div>

              {/* Identified Skills Tag set */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono">
                  Extracted Skill Parameters:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parsedResult.skills.map((skill, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-indigo-950/30 border border-indigo-500/10 text-indigo-300 text-[10px] font-sans font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Two Column Grid representing Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Core Strengths Identified */}
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold font-mono">
                    Core Strengths Identified:
                  </span>
                  <ul className="space-y-1.5">
                    {parsedResult.strengths.slice(0, 4).map((str, idx) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5 font-sans">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Relative Skill Gaps */}
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold font-mono">
                    Relative Skill Gaps:
                  </span>
                  <ul className="space-y-1.5">
                    {parsedResult.gaps.slice(0, 4).map((gap, idx) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5 font-sans">
                        <span className="text-indigo-400 font-bold mt-0.5">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                {/* Recommended Jobs */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                    Ideal Candidate Roles:
                  </span>
                  <p className="text-xs text-zinc-400 font-sans pt-1">
                    {parsedResult.suggestedRoles.join(' • ')}
                  </p>
                </div>

                {/* Education */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono block">
                    Academic Background:
                  </span>
                  <p className="text-xs text-zinc-400 font-sans pt-1">
                    {parsedResult.education}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[16rem] border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-zinc-900/10">
              <Sparkles className="w-8 h-8 text-zinc-700 animate-pulse mb-3" />
              <p className="text-zinc-400 font-semibold text-xs uppercase tracking-wider font-mono">
                Awaiting Diagnostics Assessment
              </p>
              <p className="text-zinc-650 text-[10px] max-w-sm mt-1.5 leading-relaxed font-sans">
                Submit your CV text block on the left panel. Gemini models will construct an active tech profile containing strengths summaries, gaps evaluations, and tailored recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
