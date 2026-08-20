import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CourseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CourseEditorModal({ isOpen, onClose, onSaved }: CourseEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<{ title: string; lessons: string[] }[]>([
    { title: 'Module 1: Introduction', lessons: ['Lesson 1: Overview'] }
  ]);

  if (!isOpen) return null;

  const handleAddModule = () => {
    setModules([...modules, { title: `Module ${modules.length + 1}`, lessons: ['Lesson 1'] }]);
  };

  const handleAddLesson = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons.push(`Lesson ${updated[moduleIndex].lessons.length + 1}`);
    setModules(updated);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      // 1. Insert Course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([{ title, description }])
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Insert Modules & Lessons
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const { data: modData, error: modError } = await supabase
          .from('modules')
          .insert([{ course_id: courseData.id, title: mod.title, order_index: mIdx }])
          .select()
          .single();

        if (modError) throw modError;

        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
          const lessonTitle = mod.lessons[lIdx];
          await supabase.from('lessons').insert([{
            module_id: modData.id,
            title: lessonTitle,
            content: 'Detailed lesson content goes here...',
            order_index: lIdx
          }]);
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error creating course:', err);
      alert('Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Create New Course</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSaveCourse} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Advanced Cloud Architecture"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief course overview..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Course Structure</h3>
              <button
                type="button"
                onClick={handleAddModule}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Module
              </button>
            </div>

            {modules.map((mod, mIdx) => (
              <div key={mIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => {
                    const updated = [...modules];
                    updated[mIdx].title = e.target.value;
                    setModules(updated);
                  }}
                  className="w-full font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                />

                <div className="pl-4 space-y-2 border-l-2 border-blue-500">
                  {mod.lessons.map((lesson, lIdx) => (
                    <input
                      key={lIdx}
                      type="text"
                      value={lesson}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[mIdx].lessons[lIdx] = e.target.value;
                        setModules(updated);
                      }}
                      className="w-full px-3 py-1 bg-white border border-slate-300 rounded-md text-xs"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddLesson(mIdx)}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3 h-3" /> Add Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}