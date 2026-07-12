import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, PlusCircle, Trash2, Code, FileText, UserCheck, 
  Trash, List, Loader2, Sparkles, CheckSquare, Plus, AlertCircle 
} from 'lucide-react';
import { InterviewTemplate, User } from '../types';

interface AdminPanelProps {
  token: string;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create template inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Frontend' | 'Backend' | 'System Design' | 'AI / Data Science' | 'Behavioral'>('Frontend');
  const [difficulty, setDifficulty] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [rawQuestions, setRawQuestions] = useState(''); // Text area split by newlines
  const [hasCoding, setHasCoding] = useState(false);
  const [codingTitle, setCodingTitle] = useState('');
  const [codingDesc, setCodingDesc] = useState('');
  const [starterJS, setStarterJS] = useState('');
  const [expectedTC1, setExpectedTC1] = useState('');
  const [expectedTC2, setExpectedTC2] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch templates for audit logs
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error('Quietly bypass listing admin templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this interview template permanently? This will affect upcoming campaigns.')) return;
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failure processing delete task.');
      }
      setSuccessMsg('Interview template removed successfully.');
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'An error occurred during template deletion.');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate inputs
    const parsedQuestions = rawQuestions.split('\n').map(q => q.trim()).filter(q => q.length > 5);
    if (!title.trim() || !description.trim()) {
      setError('Template title and summary explanation are required fields.');
      return;
    }
    if (parsedQuestions.length === 0) {
      setError('Please provide at least one complete interview question (one question per line).');
      return;
    }

    setSaving(true);

    const payload: Partial<InterviewTemplate> = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      questions: parsedQuestions,
    };

    if (hasCoding) {
      payload.codingPrompt = {
        title: codingTitle.trim() || 'Custom Sandbox Implementation',
        description: codingDesc.trim() || 'Implement your program solution.',
        starterCode: {
          javascript: starterJS.trim() || 'function run() {\n  // Write logic\n}',
          typescript: '',
          python: ''
        },
        testCases: [
          { input: 'Sample vector 1', expectedOutput: expectedTC1.trim() || 'Success Output' },
          { input: 'Sample vector 2', expectedOutput: expectedTC2.trim() || 'Passed check' }
        ]
      };
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error creating custom template');
      }

      setSuccessMsg(`Successfully created template index: "${data.title}"`);
      // Reset state variables
      setTitle('');
      setDescription('');
      setRawQuestions('');
      setHasCoding(false);
      setCodingTitle('');
      setCodingDesc('');
      setStarterJS('');
      setExpectedTC1('');
      setExpectedTC2('');
      fetchTemplates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Intro info banner */}
      <div className="bg-immersive-card border border-immersive p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[14px] font-mono uppercase tracking-wider font-bold text-zinc-100 flex items-center gap-1.5 leading-none">
              Platform Admin Control Panel <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            </h2>
            <p className="text-zinc-400 text-xs mt-2.5 leading-relaxed font-sans">
              Welcome System Administrator! Take command of candidate syllabus configurations. Register dynamic questions, design immersive algorithms challenges pairing test output assertions, audit existing live sessions, and moderate platform portfolios.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create template form details (col span 7) */}
        <div className="lg:col-span-7 bg-immersive-card border border-immersive p-6 rounded-2xl space-y-6 backdrop-blur-md">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-zinc-200 text-xs uppercase tracking-wider font-mono">
              Register Custom Interview Template
            </h3>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg font-sans">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreateTemplate} className="space-y-4">
            
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Position Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Distributed DB Lead"
                  className="w-full bg-zinc-950 border border-white/5 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-550/20 rounded-xl px-3.5 py-2 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-700 font-sans"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 p-2 rounded-xl outline-none transition-all focus:border-indigo-500/40 font-mono py-1.5"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="System Design">System Design</option>
                    <option value="AI / Data Science">AI / Data Science</option>
                    <option value="Behavioral">Behavioral</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 p-2 rounded-xl outline-none transition-all focus:border-indigo-500/40 font-mono py-1.5"
                  >
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Template overview description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give a short summary of syllabus competencies"
                className="w-full bg-zinc-950 border border-white/5 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-550/20 rounded-xl px-3.5 py-2 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-700 font-sans"
              />
            </div>

            {/* Questions area input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                Syllabus Question steps (One Question per line)
              </label>
              <textarea
                required
                value={rawQuestions}
                onChange={(e) => setRawQuestions(e.target.value)}
                placeholder="How does HTTP/2 multi-plexing mitigate head-of-line blocking?&#10;What database sharding partitions do you implement?&#10;Let's move onto coding..."
                rows={4}
                className="w-full bg-zinc-950 border border-white/5 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-550/20 rounded-xl p-3 text-xs text-indigo-300 outline-none transition-all placeholder:text-zinc-700 font-mono"
              />
            </div>

            {/* Coding Challenge Checkbox Toggle */}
            <div className="border border-white/5 bg-zinc-950/20 p-4 rounded-xl space-y-4 font-sans">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="admin-has-coding"
                  checked={hasCoding}
                  onChange={(e) => setHasCoding(e.target.checked)}
                  className="rounded border-white/10 bg-zinc-950 text-indigo-500 cursor-pointer accent-indigo-500"
                />
                <label htmlFor="admin-has-coding" className="text-xs text-zinc-300 font-semibold cursor-pointer select-none">
                  Incorporate Live Coding execution terminal
                </label>
              </div>

              {hasCoding && (
                <div className="space-y-4 animate-fade-in text-xs font-sans">
                  
                  {/* challenge configs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Challenge Title</label>
                      <input
                        type="text"
                        value={codingTitle}
                        onChange={(e) => setCodingTitle(e.target.value)}
                        placeholder="e.g. Reverse Binary Tree"
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 outline-none text-zinc-300 transition-all focus:border-indigo-550/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Instruction</label>
                      <input
                        type="text"
                        value={codingDesc}
                        onChange={(e) => setCodingDesc(e.target.value)}
                        placeholder="Implement reverse() and assert test cases"
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 outline-none text-zinc-300 transition-all focus:border-indigo-550/40"
                      />
                    </div>
                  </div>

                  {/* Starter JavaScript */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Starter JavaScript Code:</label>
                    <textarea
                      value={starterJS}
                      onChange={(e) => setStarterJS(e.target.value)}
                      placeholder="function mergeIntervals(intervals) { ... }"
                      rows={3}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2.5 outline-none text-indigo-300 font-mono text-[10px]"
                    />
                  </div>

                  {/* Quick assertions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Test Case 1 Expected Output</label>
                      <input
                        type="text"
                        value={expectedTC1}
                        onChange={(e) => setExpectedTC1(e.target.value)}
                        placeholder="[[1,6],[8,10]]"
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 outline-none text-zinc-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Test Case 2 Expected Output</label>
                      <input
                        type="text"
                        value={expectedTC2}
                        onChange={(e) => setExpectedTC2(e.target.value)}
                        placeholder="[[1,5]]"
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 outline-none text-zinc-300"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-4 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white py-2.5 px-4 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-glow-indigo font-mono uppercase tracking-wider"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> saving Template...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save Interview Syllabus
                </>
              )}
            </button>

          </form>
        </div>

        {/* Audit Existing templates ledger list (col span 5) */}
        <div className="lg:col-span-5 bg-immersive-card border border-immersive p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <List className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="font-bold text-zinc-200 text-xs uppercase tracking-wider font-mono">
              Auditable templates ledger ({templates.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-none font-sans">
              {templates.map(tmpl => (
                <div 
                  key={tmpl.id} 
                  className="bg-zinc-950/60 border border-white/5 p-3.5 rounded-xl flex items-start justify-between gap-3 font-sans"
                >
                  <div className="space-y-1.5 max-w-[80%] font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#0e0e11] border border-white/5 text-[8px] tracking-wider uppercase font-bold text-indigo-400 rounded-md font-mono">
                        {tmpl.category}
                      </span>
                    </div>
                    <h5 className="font-bold text-zinc-200 text-xs leading-normal">{tmpl.title}</h5>
                    <p className="text-zinc-500 text-[10px] leading-normal truncate">{tmpl.description}</p>
                    <p className="text-[9px] text-[#818cf8]/80 font-mono">Contains: {tmpl.questions.length} questions</p>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                    className="p-1.5 bg-red-950/10 hover:bg-red-950/30 text-rose-400 border border-red-500/10 rounded-xl transition-colors cursor-pointer group"
                  >
                    <Trash className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
