import { useState } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Adjust path if your supabase client is located elsewhere

interface CreateAICourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Status = 'idle' | 'generating' | 'success' | 'error';

export default function CreateAICourseModal({ onClose, onSuccess }: CreateAICourseModalProps) {
  const [topic, setTopic] = useState('');
  const [moduleCount, setModuleCount] = useState<number>(5);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [courseTitle, setCourseTitle] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 3 || status === 'generating') return;

    setStatus('generating');
    setErrorMsg('');

    try {
      // Retrieve the current user session token to pass proper authentication to the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: topic.trim(),
          module_count: moduleCount 
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setCourseTitle(data.title || topic);
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const suggestions = [
    'Intro to Python',
    'Machine Learning Basics',
    'Data Structures & Algorithms',
    'Web Development with React',
    'AI Ethics and Bias',
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={status === 'generating' ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Create AI Course</h3>
              <p className="text-xs text-slate-400">Generate a custom multi-module curriculum instantly</p>
            </div>
          </div>
          {status !== 'generating' && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>

        {status === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-slate-900 text-lg mb-1">Course created!</h4>
            <p className="text-sm text-slate-500">
              "{courseTitle}" with {moduleCount} modules has been added to your catalog.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                What should the course cover?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="e.g., Intro to Python"
                disabled={status === 'generating'}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                The AI will design a targeted curriculum title, description, and module breakdown based on your input.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-600" /> Number of Modules
              </label>
              <select
                value={moduleCount}
                onChange={(e) => setModuleCount(Number(e.target.value))}
                disabled={status === 'generating'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white text-sm"
              >
                <option value={3}>3 Modules (Short Curriculum)</option>
                <option value={5}>5 Modules (Standard Curriculum)</option>
                <option value={8}>8 Modules (Comprehensive)</option>
                <option value={10}>10 Modules (Masterclass)</option>
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTopic(s);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'generating'}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Failed to generate course</p>
                  <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {status === 'generating' && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <Loader2 className="w-5 h-5 text-violet-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-700">Generating curriculum...</p>
                  <p className="text-xs text-violet-500 mt-0.5">
                    Synthesizing {moduleCount} custom modules and learning checkpoints.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'generating'}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={topic.trim().length < 3 || status === 'generating'}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-medium hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {status === 'generating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate course
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}