import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateModuleAssistantResponse } from '@/data/moduleAssistantData';
import MarkdownContent from '@/components/MarkdownContent';
import { CodeSandbox as CodeEditor } from "@/components/CodeSandbox";
import { CodeSandbox } from '@/components/CodeSandbox';
import {
  ArrowLeft, Check, Lock, BookOpen, Send, Bot,
  ChevronRight, ChevronLeft, Crown, Loader2,
  FileText, Code2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Sparkles, Lightbulb, Wrench, Wand2,
} from 'lucide-react';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import LessonQuiz from '@/components/LessonQuiz';
import type { Course, Module, Lesson, ModuleProgress, UserProgress } from '@/types';

interface CourseLMSProps {
  course: Course;
  initialModuleId?: number | null;
  onBack: () => void;
  onEnroll: () => Promise<void>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function getCourseLanguage(course: Course): string {
  const title = course.title.toLowerCase();
  if (title.includes('python')) return 'python';
  if (title.includes('c++') || title.includes('cpp') || title.includes('systems')) return 'cpp';
  if (title.includes('java') && !title.includes('javascript')) return 'java';
  if (title.includes('javascript') || title.includes('js ')) return 'javascript';
  if (title.includes('database') || title.includes('sql')) return 'sql';
  return 'javascript';
}

export default function CourseLMS({ course, initialModuleId, onBack, onEnroll: _onEnroll }: CourseLMSProps) {
  const { profile, effectiveRole } = useAuth();
  const isSubscribed = profile?.is_subscribed ?? false;
  const isAdmin = effectiveRole === 'corporate_admin';
  const isTeacher = effectiveRole === 'teacher';
  const { loading: checkoutLoading, verifying, success: checkoutSuccess, error: checkoutError, startCheckout } = usePaystackCheckout();

  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [lessonProgress, setLessonProgress] = useState<UserProgress[]>([]);
  const [quizPassedModules, setQuizPassedModules] = useState<Set<number>>(new Set());

  const hasAccess = isSubscribed || isAdmin || isTeacher;

  useEffect(() => {
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const loadLessons = useCallback(async (moduleId: number) => {
    setLessonsLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('id, module_id, title, content_markdown, code_snippet, order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true, nullsFirst: false });

    if (error) {
      setLessons([]);
      setLessonsLoading(false);
      return;
    }
    setLessons((data as unknown as Lesson[]) || []);
    setLessonsLoading(false);
  }, []);

  useEffect(() => {
    if (activeModule) {
      loadLessons(activeModule.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule?.id]);

  useEffect(() => {
    if (activeModule && !lessonsLoading) {
      const lessonContext = lessons.map((l) => l.title).join(', ') || 'this module';
      setMessages([{
        role: 'assistant',
        content: `Welcome to "${activeModule.title}". I'm your AI assistant — ask me anything about the lesson content. Topics: ${lessonContext}.`,
        timestamp: new Date().toISOString(),
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule?.id, lessonsLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function loadModules() {
    const [modRes, progRes] = await Promise.all([
      supabase.from('modules').select('*').eq('course_id', course.id).order('order_index', { ascending: true }),
      profile ? supabase.from('module_progress').select('*').eq('course_id', course.id).eq('user_id', profile.id) : Promise.resolve({ data: [] as ModuleProgress[] }),
    ]);

    const mods = (modRes.data as unknown as Module[]) || [];
    setModules(mods);
    setProgress((progRes.data as unknown as ModuleProgress[]) || []);

    if (mods.length > 0) {
      const initial = initialModuleId ? mods.find((m) => m.id === initialModuleId) : null;
      setActiveModule(initial || mods[0]);
    }

    if (profile) {
      const { data: lpData } = await supabase
        .from('user_progress')
        .select('id, user_id, lesson_id, completed, completed_at, created_at')
        .in('lesson_id', mods.flatMap((m) => m.lessons?.map((l) => l.id) ?? []));
      let lpRows = (lpData as unknown as UserProgress[]) || [];
      if (lpRows.length === 0) {
        const { data: allLp } = await supabase
          .from('user_progress')
          .select('id, user_id, lesson_id, completed, completed_at, created_at')
          .eq('user_id', profile.id);
        lpRows = (allLp as unknown as UserProgress[]) || [];
      }
      setLessonProgress(lpRows);
    }

    setLoading(false);
  }

  function moduleProgress(mod: Module): ModuleProgress | undefined {
    return progress.find((p) => p.module_id === mod.id);
  }

  function isModuleLocked(mod: Module): boolean {
    if (hasAccess) return false;
    return !mod.is_free_preview;
  }

  function openModule(mod: Module) {
    setActiveModule(mod);
  }

  function isLessonComplete(lessonId: number): boolean {
    return lessonProgress.some((p) => p.lesson_id === lessonId && p.completed);
  }

  function isNextModuleUnlocked(currentIdx: number): boolean {
    if (hasAccess) return true;
    if (currentIdx < 0 || currentIdx >= modules.length - 1) return true;
    return quizPassedModules.has(modules[currentIdx].id);
  }

  async function markLessonComplete(lessonId: number) {
    if (!profile) return;
    const existing = lessonProgress.find((p) => p.lesson_id === lessonId);
    if (existing?.completed) return;

    const now = new Date().toISOString();
    if (existing) {
      await supabase
        .from('user_progress')
        .update({ completed: true, completed_at: now })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_progress')
        .insert({ user_id: profile.id, lesson_id: lessonId, completed: true, completed_at: now });
    }

    setLessonProgress((prev) => {
      const idx = prev.findIndex((p) => p.lesson_id === lessonId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], completed: true, completed_at: now };
        return next;
      }
      return [...prev, {
        id: `temp-${lessonId}`,
        user_id: profile.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: now,
        created_at: now,
      }];
    });
  }

  function handleQuizPass(moduleId: number) {
    setQuizPassedModules((prev) => new Set(prev).add(moduleId));
  }

  async function toggleComplete(mod: Module) {
    if (!profile || isModuleLocked(mod)) return;

    const existing = moduleProgress(mod);
    const newCompleted = !existing?.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;
    let updatedProgress: ModuleProgress | null = null;

    if (existing) {
      const { data } = await supabase
        .from('module_progress')
        .update({ completed: newCompleted, completed_at: completedAt })
        .eq('id', existing.id)
        .select('*')
        .maybeSingle();
      updatedProgress = data as unknown as ModuleProgress;
    } else {
      const { data } = await supabase
        .from('module_progress')
        .insert({ user_id: profile.id, module_id: mod.id, course_id: course.id, completed: newCompleted, completed_at: completedAt })
        .select('*')
        .maybeSingle();
      updatedProgress = data as unknown as ModuleProgress;
    }

    if (updatedProgress) {
      const nextProgress = progress.some((p) => p.id === updatedProgress!.id)
        ? progress.map((p) => (p.id === updatedProgress!.id ? updatedProgress! : p))
        : [...progress, updatedProgress];
      setProgress(nextProgress);
      await recalcEnrollment(nextProgress);
    }
  }

  async function recalcEnrollment(currentProgress: ModuleProgress[]) {
    if (!profile) return;
    const completedCount = currentProgress.filter((p) => p.completed).length;
    const pct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
    const status = pct >= 100 ? 'completed' : 'in_progress';
    const completedAt = pct >= 100 ? new Date().toISOString() : null;

    await supabase
      .from('enrollments')
      .update({ progress: pct, status, completed_at: completedAt })
      .eq('user_id', profile.id)
      .eq('course_id', course.id);
  }

  const completedCount = progress.filter((p) => p.completed).length;
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
  const completedLessons = lessonProgress.filter((p) => p.completed).length;
  const overallPct = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : modules.length > 0
      ? Math.round((completedCount / modules.length) * 100)
      : 0;
  const activeIdx = activeModule ? modules.findIndex((m) => m.id === activeModule.id) : -1;
  const activeLocked = activeModule ? isModuleLocked(activeModule) : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading course...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col animate-fade-in">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 flex-shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 flex-shrink-0 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Catalog</span>
          </button>
          <div className="h-5 w-px bg-slate-200 flex-shrink-0" />
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
            title={drawerOpen ? 'Hide modules' : 'Show modules'}
          >
            {drawerOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div className="min-w-0 hidden md:block">
            <h2 className="text-sm font-semibold text-slate-900 truncate">{course.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 sm:w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums">{overallPct}%</span>
          </div>
          <button
            onClick={() => setAssistantOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
            title={assistantOpen ? 'Hide assistant' : 'Show assistant'}
          >
            {assistantOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left module navigation drawer */}
        {drawerOpen && (
          <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 animate-slide-in-left">
            {course.image_url && (
              <div className="relative h-24 flex-shrink-0 overflow-hidden">
                <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-medium">{course.category}</p>
                  <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{course.title}</p>
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Modules</span>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">{completedCount}/{modules.length}</span>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
              {modules.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">No modules yet.</div>
              ) : (
                modules.map((mod, idx) => {
                  const prog = moduleProgress(mod);
                  const locked = isModuleLocked(mod);
                  const isActive = activeModule?.id === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => openModule(mod)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 ${
                        isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span
                        onClick={(e) => { e.stopPropagation(); if (!locked) toggleComplete(mod); }}
                        className={`mt-0.5 w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                          prog?.completed
                            ? 'bg-emerald-500 text-white'
                            : locked
                              ? 'bg-slate-100 text-slate-300'
                              : 'border-2 border-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {prog?.completed ? <Check className="w-3 h-3" /> : locked ? <Lock className="w-2.5 h-2.5" /> : null}
                      </span>
                      {mod.image_url && (
                        <img src={mod.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                          {mod.is_free_preview && !locked && (
                            <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold uppercase">Free</span>
                          )}
                          {locked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                        </div>
                        <p className={`text-sm font-medium leading-snug ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{mod.title}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </nav>
          </aside>
        )}

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
          {activeModule ? (
            <>
              {/* Module header */}
              <div className="border-b border-slate-200 px-6 sm:px-8 py-4 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <span className="font-medium">Module {activeModule.order_index}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{modules.length} total</span>
                  {activeLocked && (
                    <span className="ml-2 flex items-center gap-1 text-amber-600 font-medium">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  {activeModule.image_url && (
                    <img src={activeModule.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{activeModule.title}</h1>
                    {activeModule.description && (
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{activeModule.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lesson content scroll area */}
              <div className="flex-1 overflow-y-auto scrollbar-thin relative">
                <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6">
                  {lessonsLoading ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading lessons...
                    </div>
                  ) : lessons.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-center">
                      <div>
                        <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No lessons in this module yet.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {lessons.map((lesson, idx) => {
                        const lessonDone = isLessonComplete(lesson.id);
                        return (
                        <article key={lesson.id} className={idx > 0 ? 'pt-8 border-t border-slate-100' : ''}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              lessonDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {idx + 1}
                            </span>
                            {lessonDone ? (
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                            <h2 className="font-semibold text-slate-900 text-lg flex-1">{lesson.title}</h2>
                            {lessonDone && (
                              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Completed</span>
                            )}
                          </div>
                          {lesson.content_markdown ? (
                            <MarkdownContent content={lesson.content_markdown} className="prose prose-slate max-w-none" />
                          ) : (
                            <p className="text-sm text-slate-400 italic">No content for this lesson.</p>
                          )}
                          {lesson.code_snippet && (
                            <div className="mt-4">
                              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <Code2 className="w-3.5 h-3.5" /> Code Snippet
                                <span className="text-slate-300 normal-case font-normal ml-1">— edit and run</span>
                              </div>
                              <CodeEditor
                                initialCode={lesson.code_snippet}
                                language={getCourseLanguage(course)}
                                storageKey={`lesson-${lesson.id}-code`}
                              />
                            </div>
                          )}

                          {/* Interactive Code Sandbox embedded right into the lesson view */}
                          <div className="mt-6">
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                              <Code2 className="w-3.5 h-3.5 text-blue-600" /> Interactive Code Sandbox
                            </div>
                            <CodeSandbox />
                          </div>

                          {/* Lesson quiz — appears at the bottom of each lesson */}
                          <LessonQuiz
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                            moduleUnlocked={!activeLocked}
                            nextModuleTitle={activeIdx < modules.length - 1 ? modules[activeIdx + 1]?.title ?? null : null}
                            onPass={() => {
                              markLessonComplete(lesson.id);
                              if (activeModule) handleQuizPass(activeModule.id);
                            }}
                          />
                        </article>
                      );
                      })}
                    </div>
                  )}
                </div>

                {/* Blurred overlay for locked modules */}
                {activeLocked && !lessonsLoading && lessons.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 select-none blur-[6px] overflow-hidden">
                      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6 opacity-60">
                        <div className="space-y-8">
                          {lessons.map((lesson, idx) => (
                            <div key={lesson.id} className={idx > 0 ? 'pt-8 border-t border-slate-100' : ''}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <FileText className="w-4 h-4 text-blue-500" />
                                <h2 className="font-semibold text-slate-900 text-lg">{lesson.title}</h2>
                              </div>
                              {lesson.content_markdown && (
                                <MarkdownContent content={lesson.content_markdown} className="prose prose-slate max-w-none" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 max-w-sm w-full mx-4">
                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-center text-white">
                          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Lock className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Unlock Full Course</h3>
                          <p className="text-amber-50 text-sm mt-1">
                            Module {activeModule.order_index} and beyond are part of the premium subscription
                          </p>
                        </div>
                        <div className="p-6">
                          {checkoutSuccess ? (
                            <div className="text-center py-2">
                              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-emerald-600" />
                              </div>
                              <p className="text-sm font-semibold text-slate-900">Payment successful!</p>
                              <p className="text-xs text-slate-500 mt-1">All modules are now unlocked.</p>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2 mb-5">
                                {['Unlock all course modules', 'Unlimited AI assistant sessions', 'All advanced courses', 'Downloadable certificates'].map((feat) => (
                                  <div key={feat} className="flex items-center gap-2 text-sm text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    {feat}
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={startCheckout}
                                disabled={checkoutLoading || verifying}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {checkoutLoading ? (
                                  <><Loader2 className="w-5 h-5 animate-spin" /> Opening payment...</>
                                ) : verifying ? (
                                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                                ) : (
                                  <><Crown className="w-5 h-5" /> Unlock Full Course · KES 1,900/mo</>
                                )}
                              </button>
                              {checkoutError && (
                                <p className="text-center text-xs text-red-500 mt-3">{checkoutError}</p>
                              )}
                              <p className="text-center text-xs text-slate-400 mt-3">
                                Secure inline payment via Paystack. No redirect needed.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom navigation bar */}
              <div className="border-t border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
                <button
                  onClick={() => toggleComplete(activeModule)}
                  disabled={activeLocked}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    moduleProgress(activeModule)?.completed
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {moduleProgress(activeModule)?.completed ? (
                    <><Check className="w-4 h-4" /> <span className="hidden sm:inline">Completed</span></>
                  ) : (
                    <><Check className="w-4 h-4" /> <span className="hidden sm:inline">Mark complete</span></>
                  )}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => activeIdx > 0 && openModule(modules[activeIdx - 1])}
                    disabled={activeIdx <= 0}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                  </button>
                  <button
                    onClick={() => activeIdx < modules.length - 1 && openModule(modules[activeIdx + 1])}
                    disabled={activeIdx >= modules.length - 1 || (activeIdx >= 0 && activeIdx < modules.length - 1 && !isNextModuleUnlocked(activeIdx))}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Select a module to start learning</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
