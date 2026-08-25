import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import MarkdownContent from '@/components/MarkdownContent';
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as ChevronDownIcon,
  Pencil, Save, X, Eye, Code2, FileText, Loader2, GripVertical,
} from 'lucide-react';
import type { Course, Module, Lesson } from '@/types';
import DocumentUpload from '@/components/DocumentUpload';

interface CourseBuilderProps {
  course: Course;
  onBack: () => void;
  onCourseUpdated: () => void;
  onDeleteCourse: (courseId: number) => Promise<void>;
}

const categories = ['Computer Science', 'AI Fundamentals', 'Deep Learning', 'Business AI', 'NLP', 'AI Ethics', 'Computer Vision', 'Prompt Engineering'];
const colors = ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange', 'slate'];
const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600', emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600', rose: 'from-rose-500 to-rose-600',
  violet: 'from-violet-500 to-violet-600', cyan: 'from-cyan-500 to-cyan-600',
  orange: 'from-orange-500 to-orange-600', slate: 'from-slate-500 to-slate-600',
};

function getCourseLanguage(course: Course): string {
  const title = course.title.toLowerCase();
  if (title.includes('python')) return 'python';
  if (title.includes('c++') || title.includes('cpp') || title.includes('systems')) return 'cpp';
  if (title.includes('java') && !title.includes('javascript')) return 'java';
  if (title.includes('database') || title.includes('sql')) return 'sql';
  return 'javascript';
}

export default function CourseBuilder({ course, onBack, onCourseUpdated, onDeleteCourse }: CourseBuilderProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaTitle, setMetaTitle] = useState(course.title);
  const [metaDescription, setMetaDescription] = useState(course.description);
  const [metaCategory, setMetaCategory] = useState(course.category);
  const [metaLevel, setMetaLevel] = useState(course.level);
  const [metaDuration, setMetaDuration] = useState(course.duration_hours ?? 1);
  const [metaInstructor, setMetaInstructor] = useState(course.instructor ?? '');
  const [metaColor, setMetaColor] = useState(course.thumbnail_color ?? 'blue');
  const [metaImageUrl, setMetaImageUrl] = useState(course.image_url ?? '');
  const [metaDocumentUrl, setMetaDocumentUrl] = useState((course as any).document_url ?? '');
  const [metaPrice, setMetaPrice] = useState((course as any).price ?? 0);
  const [metaIsPro, setMetaIsPro] = useState((course as any).is_pro ?? false);
  const [metaPublished, setMetaPublished] = useState<boolean>(
    Boolean((course as any).is_published ?? (course as any).status === 'published'),
  );
  const [savingMeta, setSavingMeta] = useState(false);

  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [newModuleFreePreview, setNewModuleFreePreview] = useState(false);
  const [newModuleImageUrl, setNewModuleImageUrl] = useState('');
  const [newModuleDocumentUrl, setNewModuleDocumentUrl] = useState('');

  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');
  const [editModuleFreePreview, setEditModuleFreePreview] = useState(false);
  const [editModuleImageUrl, setEditModuleImageUrl] = useState('');
  const [editModuleDocumentUrl, setEditModuleDocumentUrl] = useState('');

  const [addingLessonForModule, setAddingLessonForModule] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('text');
  const [lessonMarkdown, setLessonMarkdown] = useState('');
  const [lessonCode, setLessonCode] = useState('');
  const [lessonDocumentUrl, setLessonDocumentUrl] = useState('');
  const [lessonPreviewMode, setLessonPreviewMode] = useState<'write' | 'preview'>('write');
  const [savingLesson, setSavingLesson] = useState(false);

  const monacoLang = getCourseLanguage(course);

  useEffect(() => {
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  async function loadModules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('modules')
      .select('*, lessons(*)')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true });

    if (!error && data) {
      const mods = (data as unknown as Module[]).map((m) => ({
        ...m,
        lessons: (m.lessons || []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
      }));
      setModules(mods);
    }
    setLoading(false);
  }

  async function saveCourseMeta(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    const { error } = await supabase
      .from('courses')
      .update({
        title: metaTitle,
        description: metaDescription,
        category: metaCategory,
        level: metaLevel,
        image_url: metaImageUrl || null,
        document_url: metaDocumentUrl || null,
        price: metaPrice,
        is_pro: metaIsPro,
        tier: metaIsPro ? 'pro' : 'free',
        is_published: metaPublished,
        published: metaPublished,
        status: metaPublished ? 'published' : 'draft',
        // duration_hours / instructor / thumbnail_color only exist if you
        // ran migration_add_course_columns.sql — remove the next 3 lines
        // if you didn't.
        duration_hours: metaDuration,
        instructor: metaInstructor,
        thumbnail_color: metaColor,
      })
      .eq('id', course.id);
    setSavingMeta(false);
    if (error) {
      console.error('Error saving course details:', error);
      alert(error.message || 'Failed to save course details.');
      return;
    }
    setEditingMeta(false);
    onCourseUpdated();
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    const nextOrder = modules.length + 1;
    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: course.id,
        title: newModuleTitle,
        description: newModuleDescription || null,
        order_index: nextOrder,
        is_free_preview: newModuleFreePreview,
        image_url: newModuleImageUrl || null,
        document_url: newModuleDocumentUrl || null,
      })
      .select('*')
      .single();

    if (!error && data) {
      setModules((prev) => [...prev, { ...(data as unknown as Module), lessons: [] }]);
      setNewModuleTitle('');
      setNewModuleDescription('');
      setNewModuleFreePreview(false);
      setNewModuleImageUrl('');
      setNewModuleDocumentUrl('');
      setAddingModule(false);
    }
  }

  function startEditModule(mod: Module) {
    setEditingModuleId(mod.id);
    setEditModuleTitle(mod.title);
    setEditModuleDescription(mod.description ?? '');
    setEditModuleFreePreview(mod.is_free_preview);
    setEditModuleImageUrl(mod.image_url ?? '');
    setEditModuleDocumentUrl((mod as any).document_url ?? '');
  }

  async function saveEditModule(e: React.FormEvent) {
    e.preventDefault();
    if (editingModuleId === null) return;
    const { error } = await supabase
      .from('modules')
      .update({
        title: editModuleTitle,
        description: editModuleDescription || null,
        is_free_preview: editModuleFreePreview,
        image_url: editModuleImageUrl || null,
        document_url: editModuleDocumentUrl || null,
      })
      .eq('id', editingModuleId);

    if (!error) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === editingModuleId
            ? { ...m, title: editModuleTitle, description: editModuleDescription, is_free_preview: editModuleFreePreview, image_url: editModuleImageUrl, document_url: editModuleDocumentUrl } as Module
            : m,
        ),
      );
      setEditingModuleId(null);
    }
  }

  async function deleteModule(moduleId: number) {
    if (!window.confirm('Delete this module and all of its lessons? This cannot be undone.')) return;
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (!error) {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
  }

  async function moveModule(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const updated = [...modules];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const reindexed = updated.map((m, i) => ({ ...m, order_index: i + 1 }));
    setModules(reindexed);
    await Promise.all([
      supabase.from('modules').update({ order_index: reindexed[index].order_index }).eq('id', reindexed[index].id),
      supabase.from('modules').update({ order_index: reindexed[newIndex].order_index }).eq('id', reindexed[newIndex].id),
    ]);
  }

  function startAddLesson(moduleId: number) {
    setAddingLessonForModule(moduleId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonType('text');
    setLessonMarkdown('');
    setLessonCode('');
    setLessonDocumentUrl('');
    setLessonPreviewMode('write');
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setAddingLessonForModule(null);
    setLessonTitle(lesson.title);
    setLessonType((lesson as any).lesson_type ?? 'text');
    setLessonMarkdown(lesson.content_markdown ?? '');
    setLessonCode(lesson.code_snippet ?? '');
    setLessonDocumentUrl((lesson as any).document_url ?? '');
    setLessonPreviewMode('write');
  }

  function cancelLessonForm() {
    setAddingLessonForModule(null);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonType('text');
    setLessonMarkdown('');
    setLessonCode('');
    setLessonDocumentUrl('');
  }

  async function saveLesson(moduleId: number) {
    if (!lessonTitle.trim()) return;
    setSavingLesson(true);
    const mod = modules.find((m) => m.id === moduleId);

    if (editingLessonId !== null) {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: lessonTitle,
          lesson_type: lessonType,
          content_markdown: lessonMarkdown || null,
          code_snippet: lessonCode || null,
          document_url: lessonDocumentUrl || null,
        })
        .eq('id', editingLessonId);

      if (!error) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: (m.lessons || []).map((l) =>
                    l.id === editingLessonId
                      ? { ...l, title: lessonTitle, content_markdown: lessonMarkdown, code_snippet: lessonCode, lesson_type: lessonType, document_url: lessonDocumentUrl } as Lesson
                      : l,
                  ),
                }
              : m,
          ),
        );
      }
    } else {
      const nextOrder = (mod?.lessons?.length ?? 0) + 1;
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          module_id: moduleId,
          title: lessonTitle,
          lesson_type: lessonType,
          content_markdown: lessonMarkdown || null,
          code_snippet: lessonCode || null,
          document_url: lessonDocumentUrl || null,
          order_index: nextOrder,
        })
        .select('*')
        .single();

      if (!error && data) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), data as unknown as Lesson] } : m,
          ),
        );
      }
    }

    setSavingLesson(false);
    cancelLessonForm();
  }

  async function deleteLesson(moduleId: number, lessonId: number) {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (!error) {
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, lessons: (m.lessons || []).filter((l) => l.id !== lessonId) } : m)),
      );
    }
  }

  async function moveLesson(moduleId: number, index: number, direction: -1 | 1) {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod || !mod.lessons) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mod.lessons.length) return;

    const updated = [...mod.lessons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const reindexed = updated.map((l, i) => ({ ...l, order_index: i + 1 }));

    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons: reindexed } : m)));

    await Promise.all([
      supabase.from('lessons').update({ order_index: reindexed[index].order_index }).eq('id', reindexed[index].id),
      supabase.from('lessons').update({ order_index: reindexed[newIndex].order_index }).eq('id', reindexed[newIndex].id),
    ]);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading course builder...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to course list
      </button>

      {/* Course meta card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 relative overflow-hidden">
          {metaImageUrl ? (
            <img src={metaImageUrl} alt={metaTitle} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[metaColor] || colorClasses.blue}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
            <div>
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">{course.category}</span>
              <h2 className="text-2xl font-bold text-white mt-2">{course.title}</h2>
            </div>
            {!editingMeta && (
              <button
                onClick={() => setEditingMeta(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit details
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editingMeta ? (
            <form onSubmit={saveCourseMeta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course title</label>
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={metaCategory} onChange={(e) => setMetaCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Level</label>
                  <select value={metaLevel} onChange={(e) => setMetaLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (hours)</label>
                  <input type="number" min={1} value={metaDuration} onChange={(e) => setMetaDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructor name</label>
                  <input value={metaInstructor} onChange={(e) => setMetaInstructor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
                  <input type="number" min={0} step="0.01" value={metaPrice} onChange={(e) => setMetaPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cover image URL (optional)</label>
                  <input value={metaImageUrl} onChange={(e) => setMetaImageUrl(e.target.value)} placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>
              <DocumentUpload
                label="Attach study material (PDF, etc.)"
                value={metaDocumentUrl}
                onChange={setMetaDocumentUrl}
                pathPrefix={`courses/${course.id}`}
              />
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={metaIsPro} onChange={(e) => setMetaIsPro(e.target.checked)} />
                  Requires Pro subscription
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={metaPublished} onChange={(e) => setMetaPublished(e.target.checked)} />
                  Published
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Accent color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button type="button" key={c} onClick={() => setMetaColor(c)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${colorClasses[c]} ${metaColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingMeta(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={savingMeta} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" /> {savingMeta ? 'Saving...' : 'Save details'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-slate-700 leading-relaxed">{course.description}</p>
          )}
        </div>
      </div>

      {/* Curriculum builder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Curriculum (Modules &amp; Lessons)</h3>
          <button
            onClick={() => setAddingModule((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add module
          </button>
        </div>

        {addingModule && (
          <form onSubmit={handleAddModule} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <input required placeholder="Module title (e.g. Module 1: Core Concepts)" value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
            <textarea placeholder="Module description (optional)" value={newModuleDescription} rows={2}
              onChange={(e) => setNewModuleDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none" />
            <input placeholder="Thumbnail image URL (optional)" value={newModuleImageUrl}
              onChange={(e) => setNewModuleImageUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={newModuleFreePreview} onChange={(e) => setNewModuleFreePreview(e.target.checked)} />
              Mark as free preview module
            </label>
            <DocumentUpload
              label="Attach study material (PDF, etc.)"
              value={newModuleDocumentUrl}
              onChange={setNewModuleDocumentUrl}
              pathPrefix={`courses/${course.id}/new-module`}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddingModule(false)} className="px-3 py-1.5 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Create module</button>
            </div>
          </form>
        )}

        {modules.length === 0 && !addingModule && (
          <p className="text-sm text-slate-500 italic">No modules yet. Add your first module to start building this course.</p>
        )}

        <div className="space-y-3">
          {modules.map((mod, idx) => {
            const isExpanded = expandedModuleId === mod.id;
            const isEditingThis = editingModuleId === mod.id;
            return (
              <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-4 bg-slate-50">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveModule(idx, -1)} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveModule(idx, 1)} disabled={idx === modules.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        Module {idx + 1}: {mod.title}
                        {mod.is_free_preview && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Free preview</span>}
                      </p>
                      <p className="text-xs text-slate-500">{mod.lessons?.length ?? 0} lesson(s)</p>
                    </div>
                  </button>

                  <button onClick={() => startEditModule(mod)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteModule(mod.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)} className="p-2 text-slate-400 hover:text-slate-700">
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isEditingThis && (
                  <form onSubmit={saveEditModule} className="p-4 bg-white border-t border-slate-200 space-y-3">
                    <input required value={editModuleTitle} onChange={(e) => setEditModuleTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                    <textarea value={editModuleDescription} rows={2} onChange={(e) => setEditModuleDescription(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none resize-none" />
                    <input placeholder="Thumbnail image URL" value={editModuleImageUrl} onChange={(e) => setEditModuleImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none" />
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={editModuleFreePreview} onChange={(e) => setEditModuleFreePreview(e.target.checked)} />
                      Free preview module
                    </label>
                    <DocumentUpload
                      label="Attach study material (PDF, etc.)"
                      value={editModuleDocumentUrl}
                      onChange={setEditModuleDocumentUrl}
                      pathPrefix={`courses/${course.id}/modules/${mod.id}`}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingModuleId(null)} className="px-3 py-1.5 text-sm text-slate-600">Cancel</button>
                      <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Save module</button>
                    </div>
                  </form>
                )}

                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200">
                    {(mod.lessons || []).map((lesson, lIdx) => (
                      <div key={lesson.id} className="border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2 p-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveLesson(mod.id, lIdx, -1)} disabled={lIdx === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveLesson(mod.id, lIdx, 1)} disabled={lIdx === (mod.lessons?.length ?? 0) - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium text-slate-800">{lIdx + 1}. {lesson.title}</span>
                          <button onClick={() => startEditLesson(lesson)} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteLesson(mod.id, lesson.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>

                        {editingLessonId === lesson.id && (
                          <LessonForm
                            title={lessonTitle} setTitle={setLessonTitle}
                            lessonType={lessonType} setLessonType={setLessonType}
                            markdown={lessonMarkdown} setMarkdown={setLessonMarkdown}
                            code={lessonCode} setCode={setLessonCode}
                            documentUrl={lessonDocumentUrl} setDocumentUrl={setLessonDocumentUrl}
                            documentPathPrefix={`courses/${course.id}/modules/${mod.id}/lessons/${lesson.id}`}
                            previewMode={lessonPreviewMode} setPreviewMode={setLessonPreviewMode}
                            monacoLang={monacoLang}
                            saving={savingLesson}
                            onCancel={cancelLessonForm}
                            onSave={() => saveLesson(mod.id)}
                          />
                        )}
                      </div>
                    ))}

                    {addingLessonForModule === mod.id ? (
                      <LessonForm
                        title={lessonTitle} setTitle={setLessonTitle}
                        lessonType={lessonType} setLessonType={setLessonType}
                        markdown={lessonMarkdown} setMarkdown={setLessonMarkdown}
                        code={lessonCode} setCode={setLessonCode}
                        documentUrl={lessonDocumentUrl} setDocumentUrl={setLessonDocumentUrl}
                        documentPathPrefix={`courses/${course.id}/modules/${mod.id}/lessons/new`}
                        previewMode={lessonPreviewMode} setPreviewMode={setLessonPreviewMode}
                        monacoLang={monacoLang}
                        saving={savingLesson}
                        onCancel={cancelLessonForm}
                        onSave={() => saveLesson(mod.id)}
                        isNew
                      />
                    ) : (
                      <button
                        onClick={() => startAddLesson(mod.id)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="w-4 h-4" /> Add lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={async () => { if (window.confirm('Delete this entire course? All modules and lessons will be removed.')) await onDeleteCourse(course.id); }}
          className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Delete course
        </button>
      </div>
    </div>
  );
}

const LESSON_TYPES = ['text', 'video', 'code', 'quiz'];

interface LessonFormProps {
  title: string; setTitle: (v: string) => void;
  lessonType: string; setLessonType: (v: string) => void;
  markdown: string; setMarkdown: (v: string) => void;
  code: string; setCode: (v: string) => void;
  documentUrl: string; setDocumentUrl: (v: string) => void;
  documentPathPrefix: string;
  previewMode: 'write' | 'preview'; setPreviewMode: (v: 'write' | 'preview') => void;
  monacoLang: string;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  isNew?: boolean;
}

function LessonForm({ title, setTitle, lessonType, setLessonType, markdown, setMarkdown, code, setCode, documentUrl, setDocumentUrl, documentPathPrefix, previewMode, setPreviewMode, monacoLang, saving, onCancel, onSave, isNew }: LessonFormProps) {
  return (
    <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
      <div className="flex items-center gap-2">
        <input
          required
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white"
        />
        <select
          value={lessonType}
          onChange={(e) => setLessonType(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white"
        >
          {LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lesson content (Markdown)</label>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode('write')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md ${previewMode === 'write' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              <Pencil className="w-3 h-3" /> Write
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md ${previewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
        </div>
        {previewMode === 'write' ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={8}
            placeholder="## Lesson heading&#10;&#10;Write the lesson content using Markdown — headings, **bold**, lists, and `inline code` are all supported."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 outline-none bg-white font-mono resize-y"
          />
        ) : (
          <div className="border border-slate-200 rounded-lg bg-white p-4 min-h-[140px]">
            {markdown ? <MarkdownContent content={markdown} /> : <p className="text-sm text-slate-400 italic">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Code2 className="w-3.5 h-3.5" /> Code snippet (optional)
        </label>
        <div className="rounded-lg overflow-hidden border border-slate-200">
          <Editor
            height="180px"
            language={monacoLang}
            value={code}
            theme="vs-dark"
            onChange={(v) => setCode(v ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false }}
          />
        </div>
      </div>

      <DocumentUpload
        label="Attach study material (PDF, etc.)"
        value={documentUrl}
        onChange={setDocumentUrl}
        pathPrefix={documentPathPrefix}
      />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : isNew ? 'Add lesson' : 'Save lesson'}
        </button>
      </div>
    </div>
  );
}
