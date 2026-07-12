import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Video, VideoOff, Mic, MicOff, Send, MessageSquare, Code, 
  Terminal, CheckCircle, ChevronRight, XCircle, BrainCircuit, Sparkles, Loader2, Award 
} from 'lucide-react';
import { InterviewTemplate, InterviewSession, Message } from '../types';

interface InterviewRoomProps {
  token: string;
  onFinishSession: () => void;
}

export default function InterviewRoom({ token, onFinishSession }: InterviewRoomProps) {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Active session parameters
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  
  // Coding environment parameters
  const [editorLanguage, setEditorLanguage] = useState<'javascript' | 'typescript' | 'python'>('javascript');
  const [codeValue, setCodeValue] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('Sandbox Terminal Ready.\nPress "Compile & Run Tests" to execute your solution.');
  const [compiling, setCompiling] = useState(false);

  // Video feed variables
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch templates
  useEffect(() => {
    let active = true;
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (active) {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplateId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading template directories:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTemplates();
    return () => {
      active = false;
    };
  }, [token]);

  // Handle active webcam mirror stream for structural realism
  useEffect(() => {
    if (activeSession && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: micActive })
        .then(stream => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Real webcam feed permission blocked or rejected, defaulting to visual avatar placeholder:', err);
          setCameraActive(false);
        });
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [activeSession, cameraActive, micActive]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Scroll to bottom of transcripts
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, replyLoading]);

  const handleStartInterview = async () => {
    if (!selectedTemplateId) return;
    setStarting(true);
    try {
      const res = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      });
      const sessionData = await res.json();
      setActiveSession(sessionData);
      
      // Auto pre-populate code layout if coding templates exist
      if (sessionData.codeContent) {
        setCodeValue(sessionData.codeContent);
      }
    } catch (err) {
      console.error('Error starting live session:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || (!inputText.trim() && !codeValue)) return;

    const payloadText = inputText;
    setInputText('');
    setReplyLoading(true);

    try {
      const res = await fetch(`/api/interviews/${activeSession.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: payloadText || '(Candidate shared code workspace)',
          codeContent: codeValue
        }),
      });

      const data = await res.json();
      setActiveSession(data.session);

      if (data.complete) {
        // Round naturally finished! Refresh user state
        setTerminalOutput('System Check: Interview round complete! Analysis grading logged successfully.');
      }
    } catch (err) {
      console.error('Failure forwarding user interview answer:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCompileCode = async () => {
    if (!activeSession) return;
    setCompiling(true);
    setTerminalOutput('Parsing script elements...\nRunning isolated sandbox compilation...');

    try {
      const response = await fetch(`/api/interviews/${activeSession.id}/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: codeValue,
          language: editorLanguage
        })
      });

      const data = await response.json();
      if (data.success) {
        setTerminalOutput(`Exit code 0 (Success):\n\n${data.output}`);
      } else {
        setTerminalOutput(`Compilation Fault (Standard Error):\n\n${data.output}`);
      }
    } catch (err: any) {
      setTerminalOutput(`Terminal Execution Timeout or Offline Error:\n${err.message || err}`);
    } finally {
      setCompiling(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (!activeSession) return;
    if (!window.confirm('Are you ready to submit your current progress and exit the interview room to generate detailed ratings?')) return;

    setReplyLoading(true);
    try {
      const res = await fetch(`/api/interviews/${activeSession.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const finalSession = await res.json();
      setActiveSession(finalSession);
    } catch (err) {
      console.error('Error completing session prematurely:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  // Preset code template overrides when candidate toggles compilers
  const handleLanguageChange = (lang: 'javascript' | 'typescript' | 'python') => {
    setEditorLanguage(lang);
    if (!activeSession) return;
    const matchedTemplate = templates.find(t => t.title === activeSession.role);
    if (matchedTemplate?.codingPrompt) {
      setCodeValue(matchedTemplate.codingPrompt.starterCode[lang] || '');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs uppercase tracking-wider font-semibold">Configuring Interview Simulators...</p>
      </div>
    );
  }

  // Pre-session checklist & selection
  if (!activeSession) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">AI Mock Practice Room</h2>
          <p className="text-xs text-slate-400 font-sans">
            Choose a preset syllabus. Practice technical logic, backend services, or systems design interactively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => setSelectedTemplateId(tmpl.id)}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                selectedTemplateId === tmpl.id
                  ? 'bg-indigo-950/20 border-indigo-500/80 shadow-indigo-500/5'
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-slate-950/50 border border-slate-950 text-indigo-400 font-sans text-[10px] uppercase tracking-wider font-bold rounded">
                    {tmpl.category}
                  </span>
                  <span className={`text-[10px] font-sans font-semibold uppercase ${
                    tmpl.difficulty === 'Senior' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {tmpl.difficulty} level
                  </span>
                </div>
                <h3 className="font-bold text-slate-150 text-sm font-sans pt-1">
                  {tmpl.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans pt-1">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/50 mt-4 flex justify-between items-center text-[10px] text-slate-500">
                <span>Cycles: {tmpl.questions.length} questions</span>
                {tmpl.codingPrompt && (
                  <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                    <Code className="w-3.5 h-3.5" /> Contains live coding challenges
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/40 border border-slate-800/85 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Aesthetic Hardware Setup</h4>
            <p className="text-slate-400 text-[10px] leading-relaxed font-sans max-w-sm mt-1">
              For higher immersion, our interview interface simulates localized webcam feeds. Enable settings below before booting.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                cameraActive 
                  ? 'bg-slate-950 border-slate-800 text-emerald-400' 
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              Webcam {cameraActive ? 'Active' : 'Unused'}
            </button>
            <button
              onClick={() => setMicActive(!micActive)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                micActive 
                  ? 'bg-slate-950 border-slate-800 text-indigo-400' 
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              Microphone {micActive ? 'Active' : 'Muted'}
            </button>
          </div>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={starting || !selectedTemplateId}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-bold text-white text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Provisioning AI Session Workspace...
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5 fill-white text-transparent" /> Enter Virtual Interview Lobby
            </>
          )}
        </button>
      </div>
    );
  }

  // Active Session Layout
  const activeTemplate = templates.find(t => t.title === activeSession.role) || templates[0];

  return (
    <div className="h-[82vh] grid grid-cols-1 lg:grid-cols-12 gap-4 text-zinc-100 font-sans">
      
      {/* COLUMN LEFT: Interview transcript, video feeds, voice sync (size: 5) */}
      <div className="lg:col-span-5 flex flex-col h-full bg-immersive-card border border-immersive rounded-2xl overflow-hidden relative shadow-lg">
        
        {/* Lobby metadata status bar */}
        <div className="p-3.5 bg-black/40 border-b border-immersive flex items-center justify-between z-10 shrink-0">
          <div>
            <h4 className="font-bold text-zinc-100 text-xs uppercase tracking-tight truncate max-w-[200px]">
              {activeSession.role}
            </h4>
            <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-mono mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
              <span>RECORDING SESSION LIVE</span>
            </div>
          </div>
          <div>
            <button
              onClick={handleEndInterviewEarly}
              disabled={activeSession.status === 'completed'}
              className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/15 text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              End Session & Sync
            </button>
          </div>
        </div>

        {/* Unified Widescreen AI Presenter + PIP Video Stage */}
        <div className="h-56 bg-zinc-950 border-b border-immersive relative overflow-hidden shrink-0 flex items-center justify-center p-4">
          
          {/* Radial visual overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.12),transparent_70%)] pointer-events-none"></div>

          {activeSession.status === 'completed' ? (
            <div className="text-center p-3 z-10">
              <Award className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 block mt-2">// Final Evaluation Concluded</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center z-10 relative">
              {/* SARA AI Avatar wave */}
              <div className="relative">
                <div className="absolute -inset-6 bg-indigo-500/10 blur-2xl rounded-full"></div>
                <div className="w-20 h-20 rounded-full border border-indigo-505/30 flex items-center justify-center p-1.5 relative z-10">
                   <div className="w-full h-full rounded-full border border-indigo-400/20 flex items-center justify-center gap-1">
                      <div className="w-0.5 h-5 bg-indigo-400/80 rounded-full animate-pulse" style={{ animationDuration: '0.8s' }}></div>
                      <div className="w-0.5 h-9 bg-indigo-300 rounded-full animate-pulse" style={{ animationDuration: '1.2s' }}></div>
                      <div className="w-0.5 h-3 bg-indigo-450 rounded-full animate-pulse" style={{ animationDuration: '0.6s' }}></div>
                      <div className="w-0.5 h-7 bg-indigo-500 rounded-full animate-pulse" style={{ animationDuration: '1s' }}></div>
                      <div className="w-0.5 h-4 bg-indigo-405 rounded-full animate-pulse" style={{ animationDuration: '0.7s' }}></div>
                   </div>
                </div>
              </div>
              <h4 className="mt-2.5 text-xs text-indigo-200 font-medium tracking-wide">
                SARA <span className="text-indigo-400/50 text-[10px] uppercase font-mono tracking-normal leading-none ml-1">// Lead Evaluator Agent</span>
              </h4>
              
              {/* Live speak sound bytes indicator */}
              <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-white/5">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Synthesizing Voice</span>
              </div>
            </div>
          )}

          {/* User Video Overlay (Picture-in-picture) */}
          <div className="absolute bottom-3 right-3 w-28 h-20 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl z-25 flex flex-col justify-between p-1 select-none">
            {cameraActive ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-600 text-center">
                <VideoOff className="w-4 h-4 mb-1" />
                <span className="text-[7px] uppercase tracking-wider block">No Feed</span>
              </div>
            )}

            {/* PIP metadata & actions */}
            <div className="absolute top-1 left-1 bg-black/50 text-[7px] text-zinc-350 font-mono py-0.5 px-1 rounded uppercase pointer-events-none">
              Client
            </div>

            <div className="absolute bottom-1 right-1 flex items-center gap-1 z-30">
              <button 
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-0.5 bg-black/60 hover:bg-black/80 rounded border border-white/10 text-white cursor-pointer transition-colors`}
                title="Toggle local camera Feed"
              >
                {cameraActive ? <Video className="w-2.5 h-2.5 text-emerald-400" /> : <VideoOff className="w-2.5 h-2.5 text-zinc-500" />}
              </button>
              <button 
                onClick={() => setMicActive(!micActive)}
                className={`p-0.5 bg-black/60 hover:bg-black/80 rounded border border-white/10 text-white cursor-pointer transition-colors`}
                title="Toggle local microphone Feed"
              >
                {micActive ? <Mic className="w-2.5 h-2.5 text-indigo-400" /> : <MicOff className="w-2.5 h-2.5 text-zinc-500" />}
              </button>
            </div>
          </div>
          
          <span className="absolute top-2 left-2 px-1 py-0.5 bg-black/50 text-[7px] font-mono rounded border border-white/5 text-zinc-500 tracking-wider">
            LOCAL TIME: 10:04 UTC
          </span>
        </div>

        {/* Chat text transcript area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 font-sans bg-black/20 scrollbar-none">
          {activeSession.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'ai' ? 'self-start mr-auto' : 'self-end ml-auto'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-500 px-1">
                {msg.sender === 'ai' ? (
                  <>
                    <BrainCircuit className="w-3 h-3 text-indigo-400" />
                    <span className="font-semibold text-zinc-400">Interviewer</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-zinc-400">Candidate</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div 
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  msg.sender === 'ai'
                    ? 'bg-indigo-950/20 border-indigo-500/10 text-zinc-200 shadow-sm'
                    : 'bg-zinc-900 border-white/5 text-zinc-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {replyLoading && (
            <div className="flex flex-col mr-auto max-w-[85%]">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-indigo-400 font-medium px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Interviewer is analyzing profile transcript...</span>
              </div>
            </div>
          )}

          {activeSession.status === 'completed' && activeSession.feedback && (
            <div className="p-5 bg-indigo-950/15 border border-indigo-500/20 rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-indigo-200">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm">Grading Diagnostics Formulated!</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                The interview session has been fully synthesized by our Gemini model evaluation engine.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 text-center">
                  <div className="text-rose-400 font-mono text-xl font-bold">{activeSession.feedback.overallScore}/100</div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 mt-1">Weighted score</div>
                </div>
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 text-center">
                  <div className="text-emerald-400 font-mono text-xl font-bold">{activeSession.feedback.questionsFeedback.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 mt-1">Questions rated</div>
                </div>
              </div>
              <button
                onClick={onFinishSession}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-xs font-bold font-sans rounded-lg transition-colors shadow-glow-indigo cursor-pointer"
              >
                Access Detailed Performance Sheet
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>        {/* Reply text/voice controls */}
        {activeSession.status !== 'completed' && (
          <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-immersive flex items-center gap-2">
            <input
              type="text"
              required
              disabled={replyLoading}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Formulate your response..."
              className="flex-grow bg-zinc-950 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/35 py-2 px-3 text-xs rounded-lg text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={replyLoading || !inputText.trim()}
              className="p-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* COLUMN RIGHT: Interactive Live Coding Editor (size: 7) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-editor-bg border border-immersive rounded-2xl overflow-hidden shadow-inner">
        
        {/* Editor controls bar */}
        <div className="px-4 py-3 bg-black/40 border-b border-immersive flex flex-col sm:flex-row gap-3 sm:items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/10 text-indigo-400 rounded-lg">
              <Code className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-200 uppercase tracking-wider font-sans">
                Technical Workspace
              </h4>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wide">Live Express Sandbox Engine</p>
            </div>
          </div>

          {activeTemplate.codingPrompt && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-400 font-sans uppercase font-bold tracking-wider">Engine:</span>
              <select
                value={editorLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as any)}
                className="bg-zinc-950 border border-white/10 text-xs text-zinc-350 py-1 pl-2 pr-6 rounded-md outline-none transition-all focus:border-indigo-500/50"
              >
                <option value="javascript">JavaScript (Node v18)</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python 3</option>
              </select>
            </div>
          )}
        </div>

        {/* Visual editor tab navigation bar (Mockup aesthetic) */}
        <div className="h-10 bg-black/40 border-b border-immersive flex items-center px-4 shrink-0 select-none">
          <div className="flex items-center gap-px">
            <div className="px-4 py-2 bg-[#0d0d0f] border-x border-t border-white/5 text-xs text-indigo-400 rounded-t-md flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {editorLanguage === 'javascript' ? 'solution.js' : editorLanguage === 'typescript' ? 'solution.ts' : 'solution.py'}
            </div>
            <div className="px-4 py-2 text-[10px] text-zinc-500 font-mono hover:text-zinc-400">package.json</div>
            <div className="px-4 py-2 text-[10px] text-zinc-500 font-mono hover:text-zinc-400">tsconfig.json</div>
          </div>
        </div>

        {/* Split container inside right panel */}
        <div className="flex-grow grid grid-rows-12 overflow-hidden">
          
          {/* Top row: Coding challenge description if available, else simple scratchpad */}
          <div className="row-span-4 bg-zinc-950/20 p-4 border-b border-immersive overflow-y-auto space-y-3 font-sans">
            {activeTemplate.codingPrompt ? (
              <div className="space-y-1.5 text-xs">
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] uppercase tracking-wider font-bold rounded">
                  Instruction
                </span>
                <h5 className="font-bold text-zinc-300 text-xs mt-1.5 font-sans">{activeTemplate.codingPrompt.title}</h5>
                <p className="text-zinc-400 leading-normal font-sans pt-0.5">
                  {activeTemplate.codingPrompt.description}
                </p>
                
                {/* Seeded test cases representation */}
                <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-immersive mt-2 space-y-1 font-sans">
                  <span className="text-[9px] text-zinc-450 block font-semibold uppercase tracking-wider">Diagnostic test vectors:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {activeTemplate.codingPrompt.testCases.map((tc, idx) => (
                      <div key={idx} className="bg-zinc-950/80 p-2 rounded border border-white/5 font-mono text-[9px] space-y-1">
                        <div className="text-indigo-400 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" /> Input: {tc.input}
                        </div>
                        <div className="text-zinc-500">
                          Expected: {tc.expectedOutput}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
                <h5 className="font-bold text-zinc-400 text-xs uppercase tracking-wider font-sans">Behavioral/System Scratchpad</h5>
                <p className="text-zinc-650 text-[10px] max-w-sm mt-1 leading-normal font-sans">
                  Use this side code canvas panels to sketch system structural configurations, API schemas, or jot notes during structural design phases.
                </p>
              </div>
            )}
          </div>

          {/* Middle row: Coding text input box (6 rows) */}
          <div className="row-span-5 bg-zinc-950/40 p-1 relative flex flex-col">
            <textarea
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              placeholder="Write your clean, functional execution solution script here..."
              className="w-full flex-grow bg-transparent p-4 font-mono text-xs leading-relaxed tracking-wide text-indigo-200 outline-none resize-none"
              style={{ tabSize: 2 }}
            />
            
            {/* Sync trigger floating button */}
            <div className="absolute right-3 bottom-3 flex gap-2">
              <button
                onClick={handleCompileCode}
                disabled={compiling}
                className="px-3.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 active:bg-zinc-950 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60 font-mono text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-glow-indigo cursor-pointer"
              >
                {compiling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" /> Execute Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom row: Sandbox Terminal stdout logger (3 rows) */}
          <div className="row-span-3 bg-zinc-950 border-t border-immersive p-3 overflow-y-auto font-mono text-[9px] text-zinc-400 flex flex-col">
            <span className="text-[8px] uppercase font-sans font-bold tracking-widest text-zinc-650 block mb-1">
              Sandbox execution stdout
            </span>
            <pre className="whitespace-pre-wrap flex-grow leading-relaxed max-h-[120px] scrollbar-none text-zinc-300 font-mono">
              {terminalOutput}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
