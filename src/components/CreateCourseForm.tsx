import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Save, Loader2,
  Layers, FileText, GripVertical,
} from 'lucide-react';

/**
 * ---- Local draft types -------------------------------------------------
 * These describe the *form* state, not the DB rows. Real rows get their
 * ids only after insert. Keep these in sync with your actual Supabase
 * columns (see the SQL migration + notes shared alongside this file).
 */
interface DraftLesson {
  key: string; // client-only id for React lists, not persisted
  title: string;
  lesson_type: string;
  content_markdown: string;
  code_snippet: string;
}

interface DraftModule {
  key: string;
  title: string;
  description: string;
  image_url: string;
  is_free_preview: boolean;
  lessons: DraftLesson[];
}

interface CreateCourseFormProps {
  onBack: () => void;
  onCreated: (courseId: number) => void;
}

const CATEGORY_SUGGESTIONS = ['Core', 'Basic', 'Common', 'AI Fundamentals', 'Computer Science', 'Deep Learning'];
const LEVEL_SUGGESTIONS = ['Level 6', 'beginner', 'intermediate', 'advanced'];
const LESSON_TYPES = ['text', 'video', 'code', 'quiz'];
const THUMBNAIL_COLORS = ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange', 'slate'];

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `draft-${Date.now()}-${keyCounter}`;
}

function emptyLesson(): DraftLesson {
  return { key: newKey(), title: '', lesson_type: 'text', content_markdown: '', code_snippet: '' };
}

function emptyModule(): DraftModule {
  return { key: newKey(), title: '', description: '', image_url: '', is_free_preview: false, lessons: [emptyLesson()] };
}

export default function CreateCourseForm({ onBack, onCreated }: CreateCourseFormProps) {
  const { profile, user } = useAuth();

  // --- Course-level fields (real `courses` columns) ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState(0);
  const [isPro, setIsPro] = useState(false); // drives both is_pro and tier
  const [publishNow, setPublishNow] = useState(true); // drives is_published, published, status
  const [imageUrl, setImageUrl] = useState('');

  // --- Extra columns that require the migration in
  //     migration_add_course_columns.sql. Remove this block if you'd
  //     rather not add those columns. ---
  const [durationHours, setDurationHours] = useState(1);
  const [instructor, setInstructor] = useState(profile?.full_name || '');
  const [thumbnailColor, setThumbnailColor] = useState('blue');

  const [modules, setModules] = useState<DraftModule[]>([emptyModule()]);
  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>(modules[0]?.key ?? null);

  const [existingCategories, setExistingCategories] = useState<string[]>(CATEGORY_SUGGESTIONS);
  const [existingLevels, setExistingLevels] = useState<string[]>(LEVEL_SUGGESTIONS);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pull real category/level values already in use so the datalist
    // suggests what your data actually looks like, not a guessed enum.
    (async () => {
      const { data } = await supabase.from('courses').select('category, level');
      if (data) {
        const cats = Array.from(new Set(data.map((r: any) => r.category).filter(Boolean)));
        const lvls = Array.from(new Set(data.map((r: any) => r.level).filter(Boolean)));
        if (cats.length) setExistingCategories(cats);
        if (lvls.length) setExistingLevels(lvls);
      }
    })();
  }, []);

  function updateModule(key: string, patch: Partial<DraftModule>) {
    setModules((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function addModule() {
    const mod = emptyModule();
    setModules((prev) => [...prev, mod]);
    setExpandedModuleKey(mod.key);
  }

  function removeModule(key: string) {
    setModules((prev) => prev.filter((m) => m.key !== key));
  }

  function moveModule(index: number, direction: -1 | 1) {
    setModules((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addLesson(moduleKey: string) {
    setModules((prev) =>
      prev.map((m) => (m.key === moduleKey ? { ...m, lessons: [...m.lessons, emptyLesson()] } : m)),
    );
  }

  function updateLesson(moduleKey: string, lessonKey: string, patch: Partial<DraftLesson>) {
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey
          ? { ...m, lessons: m.lessons.map((l) => (l.key === lessonKey ? { ...l, ...patch } : l)) }
          : m,
      ),
    );
  }

  function removeLesson(moduleKey: string, lessonKey: string) {
    setModules((prev) =>
      prev.map((m) => (m.key === moduleKey ? { ...m, lessons: m.lessons.filter((l) => l.key !== lessonKey) } : m)),
    );
  }

  function validate(): string | null {
    if (!title.trim()) return 'Course title is required.';
    if (!category.trim()) return 'Category is required.';
    if (!level.trim()) return 'Level is required.';
    for (const [mi, mod] of modules.entries()) {
      if (!mod.title.trim()) return `Module ${mi + 1} needs a title.`;
      for (const [li, lesson] of mod.lessons.entries()) {
        if (!lesson.title.trim()) return `Module ${mi + 1}, lesson ${li + 1} needs a title.`;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    try {
      // 1. Insert the course row with the REAL columns.
      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim(),
          level: level.trim(),
          price,
          is_pro: isPro,
          tier: isPro ? 'pro' : 'free',
          is_published: publishNow,
          published: publishNow,
          status: publishNow ? 'published' : 'draft',
          image_url: imageUrl.trim() || null,
          organization_id: (profile as any)?.organization_id ?? null,
          created_by: user.id,
          // Remove these three if you skipped the migration:
          duration_hours: durationHours,
          instructor: instructor.trim() || null,
          thumbnail_color: thumbnailColor,
        })
        .select('*')
        .single();

      if (courseError || !courseRow) {
        throw courseError || new Error('Course insert returned no row.');
      }

      const courseId = courseRow.id as number;

      // 2. Insert modules, in order, one at a time so we can attach
      //    each module's own lessons using its real generated id.
      for (const [mIdx, mod] of modules.entries()) {
        const { data: moduleRow, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_id: courseId,
            title: mod.title.trim(),
            description: mod.description.trim() || null,
            order_index: mIdx + 1,
            is_free_preview: mod.is_free_preview,
            image_url: mod.image_url.trim() || null,
          })
          .select('*')
          .single();

        if (moduleError || !moduleRow) {
          throw moduleError || new Error(`Failed to create module "${mod.title}".`);
        }

        const lessonsToInsert = mod.lessons
          .filter((l) => l.title.trim())
          .map((l, lIdx) => ({
            module_id: moduleRow.id,
            title: l.title.trim(),
            lesson_type: l.lesson_type,
            content_markdown: l.content_markdown.trim() || null,
            code_snippet: l.code_snippet.trim() || null,
            order_index: lIdx + 1,
          }));

        if (lessonsToInsert.length > 0) {
          const { error: lessonsError } = await supabase.from('lessons').insert(lessonsToInsert);
          if (lessonsError) throw lessonsError;
        }
      }

      onCreated(courseId);
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err?.message || 'Something went wrong while creating the course. Check the console for details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-6 pb-16">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to course list
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Create a new course</h2>
        <p className="text-slate-500 text-sm mt-1">Fill in the course details, then add modules and lessons below.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Course details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Course details</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <input required list="category-options" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Core, AI Fundamentals"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
            <datalist id="category-options">
              {existingCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Level</label>
            <input required list="level-options" value={level} onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g. beginner, Level 6"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
            <datalist id="level-options">
              {existingLevels.map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
            <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (hours)</label>
            <input type="number" min={0} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructor</label>
            <input value={instructor} onChange={(e) => setInstructor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cover image URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Accent color (used when there's no cover image)</label>
          <div className="flex gap-2">
            {THUMBNAIL_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setThumbnailColor(c)}
                className={`w-7 h-7 rounded-full bg-gradient-to-br from-${c}-500 to-${c}-600 ${thumbnailColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} />
            Requires Pro subscription
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            Publish immediately (otherwise saved as draft)
          </label>
        </div>
      </div>

      {/* Modules & lessons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Modules &amp; lessons</h3>
          <button type="button" onClick={addModule}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add module
          </button>
        </div>

        <div className="space-y-3">
          {modules.map((mod, mIdx) => {
            const isExpanded = expandedModuleKey === mod.key;
            return (
              <div key={mod.key} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-4 bg-slate-50">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveModule(mIdx, -1)} disabled={mIdx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveModule(mIdx, 1)} disabled={mIdx === modules.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <button type="button" onClick={() => setExpandedModuleKey(isExpanded ? null : mod.key)}
                    className="flex-1 text-left">
                    <p className="font-semibold text-slate-900 text-sm">
                      Module {mIdx + 1}: {mod.title || <span className="text-slate-400 italic">Untitled module</span>}
                    </p>
                    <p className="text-xs text-slate-500">{mod.lessons.length} lesson(s)</p>
                  </button>
                  {modules.length > 1 && (
                    <button type="button" onClick={() => removeModule(mod.key)} className="p-2 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setExpandedModuleKey(isExpanded ? null : mod.key)}
                    className="p-2 text-slate-400 hover:text-slate-700">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-200">
                    <input required placeholder="Module title (e.g. Module 1: Core Concepts)" value={mod.title}
                      onChange={(e) => updateModule(mod.key, { title: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                    <textarea placeholder="Module description (optional)" rows={2} value={mod.description}
                      onChange={(e) => updateModule(mod.key, { description: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none" />
                    <input placeholder="Module thumbnail image URL (optional)" value={mod.image_url}
                      onChange={(e) => updateModule(mod.key, { image_url: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={mod.is_free_preview}
                        onChange={(e) => updateModule(mod.key, { is_free_preview: e.target.checked })} />
                      Free preview module
                    </label>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Lessons
                        </h4>
                        <button type="button" onClick={() => addLesson(mod.key)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                          <Plus className="w-3.5 h-3.5" /> Add lesson
                        </button>
                      </div>

                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson.key} className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-slate-50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <input required placeholder={`Lesson ${lIdx + 1} title`} value={lesson.title}
                              onChange={(e) => updateLesson(mod.key, lesson.key, { title: e.target.value })}
                              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 outline-none bg-white" />
                            <select value={lesson.lesson_type}
                              onChange={(e) => updateLesson(mod.key, lesson.key, { lesson_type: e.target.value })}
                              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white outline-none">
                              {LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {mod.lessons.length > 1 && (
                              <button type="button" onClick={() => removeLesson(mod.key, lesson.key)}
                                className="p-1.5 text-slate-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <textarea placeholder="Lesson content (Markdown, optional)" rows={3} value={lesson.content_markdown}
                            onChange={(e) => updateLesson(mod.key, lesson.key, { content_markdown: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-mono resize-y" />
                          {lesson.lesson_type === 'code' && (
                            <div className="rounded-lg overflow-hidden border border-slate-200">
                              <Editor
                                height="140px"
                                language="javascript"
                                value={lesson.code_snippet}
                                theme="vs-dark"
                                onChange={(v) => updateLesson(mod.key, lesson.key, { code_snippet: v ?? '' })}
                                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onBack} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Creating course...' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
