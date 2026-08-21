import { fetchAITutorResponse } from '../../lib/aiHelper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { GraduationCap, Plus, Clock, BarChart3, Users, BookOpen, Search, X, Trash2, Crown, Sparkles } from 'lucide-react';
import CourseBuilder from '@/components/CourseBuilder';
import type { Course, Enrollment, Module } from '@/types';
import PremiumUpgrade, { PremiumBadge, LockedOverlay } from '@/components/PremiumUpgrade';
import BuyTeamSeats from '@/components/BuyTeamSeats';
import CourseLMS from '@/components/CourseLMS';
import CreateAICourseModal from '@/components/CreateAICourseModal';

const colorClasses: Record<string, { gradient: string; bg: string; text: string }> = {
  blue: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', text: 'text-rose-600' },
  violet: { gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  cyan: { gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  orange: { gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' },
  slate: { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', text: 'text-slate-600' },
};

const levelBadge: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

const rawModulesData = [
  { course_id: 1, title: 'Module 1: HTML5, CSS3 & Responsive UI Design', description: 'Learn semantic HTML5, modern CSS styling, flexbox, and responsive design fundamentals.', order_index: 1, is_free_preview: true },
  { course_id: 1, title: 'Module 2: JavaScript ES6+ & DOM Manipulation', description: 'Master core JavaScript concepts, functions, async programming, and interactive DOM manipulation.', order_index: 2, is_free_preview: false },
  { course_id: 1, title: 'Module 3: Frontend Frameworks (React.js & Tailwind)', description: 'Build single-page applications with React components, hooks, state management, and Tailwind CSS.', order_index: 3, is_free_preview: false },
  { course_id: 1, title: 'Module 4: Backend API Development (Node.js & Express)', description: 'Develop RESTful Web APIs, handle requests/responses, routing, and backend middleware.', order_index: 4, is_free_preview: false },
  { course_id: 1, title: 'Module 5: Database Integration & Deployment', description: 'Connect frontend and backend services to Supabase PostgreSQL and deploy full-stack apps.', order_index: 5, is_free_preview: false },
  { course_id: 2, title: 'Module 1: Big-O Notation & Complexity Analysis', description: 'Analyze algorithm performance using time and space complexity and asymptotic notation.', order_index: 1, is_free_preview: true },
  { course_id: 2, title: 'Module 2: Arrays, Linked Lists & Recursion', description: 'Implement linear data structures and write efficient recursive algorithms.', order_index: 2, is_free_preview: false },
  { course_id: 2, title: 'Module 3: Stacks, Queues & Hash Tables', description: 'Explore LIFO/FIFO data structures and build constant-time lookup hash tables.', order_index: 3, is_free_preview: false },
  { course_id: 2, title: 'Module 4: Trees, Binary Search & Graph Algorithms', description: 'Learn binary search trees, graph traversals (BFS/DFS), and shortest-path algorithms.', order_index: 4, is_free_preview: false },
  { course_id: 2, title: 'Module 5: Dynamic Programming & Greedy Algorithms', description: 'Solve complex optimization problems using memoization, tabulation, and greedy strategies.', order_index: 5, is_free_preview: false },
  { course_id: 3, title: 'Module 1: Relational Database Modeling & Normalization', description: 'Design entity-relationship diagrams (ERDs) and apply database normalization techniques.', order_index: 1, is_free_preview: true },
  { course_id: 3, title: 'Module 2: SQL Fundamentals & CRUD Operations', description: 'Write standard SQL queries to insert, update, delete, and retrieve tabular data.', order_index: 2, is_free_preview: false },
  { course_id: 3, title: 'Module 3: Advanced Joins, Subqueries & Aggregations', description: 'Query multi-table datasets using INNER/LEFT/RIGHT JOINs, GROUP BY, and subqueries.', order_index: 3, is_free_preview: false },
  { course_id: 3, title: 'Module 4: Transactions, Indexing & Query Optimization', description: 'Ensure data integrity with ACID transactions and optimize query performance with indexes.', order_index: 4, is_free_preview: false },
  { course_id: 3, title: 'Module 5: NoSQL Databases & Supabase Security', description: 'Compare document/key-value databases and enforce Supabase Row Level Security (RLS).', order_index: 5, is_free_preview: false },
  { course_id: 4, title: 'Module 1: Python Basics, Control Flow & Data Types', description: 'Build foundational Python skills covering variables, conditional logic, loops, and lists.', order_index: 1, is_free_preview: true },
  { course_id: 4, title: 'Module 2: Functions, Scope & Modules', description: 'Write modular reusable code using Python functions, arguments, return values, and imports.', order_index: 2, is_free_preview: false },
  { course_id: 4, title: 'Module 3: Classes, Objects & Constructors', description: 'Model real-world entities using Python classes, attributes, methods, and __init__ constructors.', order_index: 3, is_free_preview: false },
  { course_id: 4, title: 'Module 4: Inheritance, Polymorphism & Encapsulation', description: 'Apply core OOP paradigms to structure maintainable and scalable code architectures.', order_index: 4, is_free_preview: false },
  { course_id: 5, title: 'Module 5: File Handling, Exception Handling & Testing', description: 'Manage external file I/O, handle runtime errors gracefully, and write unit tests.', order_index: 5, is_free_preview: false },
  { course_id: 5, title: 'Module 1: Fundamentals of AI & Prompt Engineering', description: 'Understand core AI concepts, large language models, and practical prompt engineering techniques.', order_index: 1, is_free_preview: true },
  { course_id: 5, title: 'Module 2: Data Analysis with NumPy & Pandas', description: 'Clean, transform, analyze, and visualize structured datasets using Python data libraries.', order_index: 2, is_free_preview: false },
  { course_id: 5, title: 'Module 3: Supervised Learning (Regression & Classification)', description: 'Train predictive models using linear regression, decision trees, and classification algorithms.', order_index: 3, is_free_preview: false },
  { course_id: 5, title: 'Module 4: Neural Networks & Deep Learning Intro', description: 'Discover artificial neural networks, activation functions, and basic deep learning architectures.', order_index: 4, is_free_preview: false },
  { course_id: 5, title: 'Module 5: Deploying AI Models via APIs', description: 'Package machine learning models into web APIs for integration into web applications.', order_index: 5, is_free_preview: false }
];

export async function fetchCoursesWithModules() {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        title,
        description,
        order_index,
        is_free_preview,
        image_url,
        lessons (
          id,
          title,
          lesson_type,
          order_index
        )
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses and modules:', error);
    return [];
  }

  return data;
}

export default function TrainingPortal() {
  const { profile, user, effectiveRole } = useAuth();
  const isAdmin = effectiveRole === 'corporate_admin';
  const isTeacher = effectiveRole === 'teacher';
  const isEducator = isAdmin || isTeacher;
  const isStudent = effectiveRole === 'student';

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAICourseModal, setShowAICourseModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPremium = profile?.is_premium ?? false;
  const categories = ['all', ...Array.from(new Set(courses.map((c) => c.category)))];

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    
    const [fetchedCoursesData, enrollRes] = await Promise.all([
      fetchCoursesWithModules(),
      supabase.from('enrollments').select('*, course:courses(*)').eq('user_id', profile.id),
    ]);

    let fetchedCourses = (fetchedCoursesData as unknown as Course[]) || [];
    const totalModules = fetchedCourses.reduce((acc, c) => acc + (c.modules?.length || 0), 0);

    if (fetchedCourses.length > 0 && totalModules === 0) {
      console.log('Seeding modules to Supabase...');
      const modulesToInsert = rawModulesData.map((mod) => {
        const targetCourse = fetchedCourses[mod.course_id - 1] || fetchedCourses[0];
        return {
          course_id: targetCourse.id,
          title: mod.title,
          description: mod.description,
          order_index: mod.order_index,
          is_free_preview: mod.is_free_preview,
        };
      });

      await supabase.from('modules').insert(modulesToInsert);
      fetchedCourses = (await fetchCoursesWithModules() as unknown as Course[]) || [];
    }

    setCourses(fetchedCourses);
    setEnrollments((enrollRes.data as unknown as Enrollment[]) || []);
    setLoading(false);
  }

  const reloadSingleCourse = async (courseId: number) => {
    const { data } = await supabase
      .from('courses')
      .select(`
        *,
        modules (
          id,
          title,
          description,
          order_index,
          is_free_preview,
          image_url,
          lessons (*)
        )
      `)
      .eq('id', courseId)
      .single();

    if (data) {
      setSelectedCourse(data as unknown as Course);
      loadData();
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function getEnrollment(courseId: number): Enrollment | undefined {
    return enrollments.find((e) => e.course_id === courseId);
  }

  async function enroll(courseId: number) {
    if (!user) return;
    const { data } = await supabase
      .from('enrollments')
      .insert({ user_id: user.id, course_id: courseId, progress: 0, status: 'not_started' })
      .select('*, course:courses(*)')
      .maybeSingle();
    if (data) {
      setEnrollments((prev) => [...prev, data as unknown as Enrollment]);
    }
  }

  async function deleteCourse(courseId: number) {
    await supabase.from('courses').delete().eq('id', courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setSelectedCourse(null);
  }

  async function createCourse(courseData: Partial<Course>) {
    if (!user) return;
    const { data } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category || 'AI Fundamentals',
        level: courseData.level || 'beginner',
        duration_hours: courseData.duration_hours || 1,
        instructor: courseData.instructor || profile.full_name || 'Instructor',
        thumbnail_color: courseData.thumbnail_color || 'blue',
        is_published: true,
        created_by: user.id,
      })
      .select('*')
      .maybeSingle();

    if (data) {
      const created = data as unknown as Course;
      setCourses((prev) => [created, ...prev]);
      setShowCreateModal(false);
      // Auto-open course builder for newly created course
      setSelectedCourse(created);
    }
  }
    const currentModules = selectedCourse.modules || [];
    const nextIndex = currentModules.length + 1;

    const { error } = await supabase.from('modules').insert([
      {
        course_id: selectedCourse.id,
        title: newModuleTitle,
        description: newModuleDescription,
        order_index: nextIndex,
        is_free_preview: false,
      },
    ]);

    if (!error) {
      setNewModuleTitle('');
      setNewModuleDescription('');
      reloadSingleCourse(selectedCourse.id);
    }
  }

    const { error } = await supabase.from('lessons').insert([
      {
        module_id: moduleId,
        title,
        lesson_type: 'video',
        order_index: currentLessonsCount + 1,
      },
    ]);

    if (!error && selectedCourse) {
      reloadSingleCourse(selectedCourse.id);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading courses...</div>;
  }

   if (selectedCourse) {
    if (isEducator) {
      return (
        <CourseBuilder
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onCourseUpdated={loadData}
          onDeleteCourse={deleteCourse}
        />
      );
    }

    return (
      <CourseLMS
        course={selectedCourse}
        initialModuleId={selectedModuleId}
        onBack={() => {
          setSelectedCourse(null);
          setSelectedModuleId(null);
        }}
        onEnroll={async () => { await enroll(selectedCourse.id); }}
      />
    );
  }


          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-32 relative overflow-hidden">
              {selectedCourse.image_url ? (
                <img src={selectedCourse.image_url} alt={selectedCourse.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[selectedCourse.thumbnail_color || 'blue']?.gradient || colorClasses.blue.gradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${levelBadge[selectedCourse.level] || levelBadge.beginner}`}>{selectedCourse.level}</span>
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">{selectedCourse.category}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-700 leading-relaxed mb-6">{selectedCourse.description}</p>

              {/* Course Builder Section */}
              <div className="space-y-6 mb-8">
                <h3 className="text-lg font-bold text-slate-900">Curriculum Builder (Modules & Lessons)</h3>

                {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                  [...selectedCourse.modules]
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((module: any, idx: number) => (
                      <div key={module.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900 text-base">
                            Module {idx + 1}: {module.title}
                          </h4>
                          {module.is_free_preview && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Free Preview</span>
                          )}
                        </div>
                        {module.description && <p className="text-sm text-slate-600 mb-4">{module.description}</p>}

                        {/* Lessons List inside Module */}
                        <div className="space-y-2 pl-4 border-l-2 border-slate-200 my-3">
                          {module.lessons && module.lessons.length > 0 ? (
                            module.lessons
                              .sort((a: any, b: any) => a.order_index - b.order_index)
                              .map((lesson: any, lIdx: number) => (
                                <div key={lesson.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4 text-slate-400" />
                                    <span>{lIdx + 1}. {lesson.title}</span>
                                  </div>
                                  <span className="text-xs uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                    {lesson.lesson_type || 'video'}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No lessons in this module yet.</p>
                          )}

                          <button
                            onClick={() => handleAddLesson(module.id, module.lessons?.length || 0)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-2"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Lesson
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No modules added yet. Add your first module below.</p>
                )}

                {/* Add Module Form */}
                <form onSubmit={handleAddModule} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Add New Module</h4>
                  <input
                    type="text"
                    required
                    placeholder="Module Title (e.g. Module 1: Core Concepts)..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Module Description (optional)..."
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Module
                  </button>
                </form>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => deleteCourse(selectedCourse.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete course
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <CourseLMS
        course={selectedCourse}
        initialModuleId={selectedModuleId}
        onBack={() => {
          setSelectedCourse(null);
          setSelectedModuleId(null);
        }}
        onEnroll={async () => { await enroll(selectedCourse.id); }}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isEducator ? 'Course Management' : 'Training Catalog'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isEducator ? 'Create and manage training courses for your learners' : 'Browse and enroll in training courses'}
          </p>
        </div>
        {isEducator && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAICourseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Create AI Course
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Manual</span>
            </button>
          </div>
        )}
      </div>

      {isEducator && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><BookOpen className="w-4 h-4" /> Total courses</div>
            <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><BarChart3 className="w-4 h-4" /> Categories</div>
            <p className="text-2xl font-bold text-slate-900">{categories.length > 1 ? categories.length - 1 : 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Clock className="w-4 h-4" /> Total hours</div>
            <p className="text-2xl font-bold text-slate-900">{courses.reduce((sum, c) => sum + (c.duration_hours ?? 0), 0)}</p>
          </div>
        </div>
      )}

      {/* Conditionally render upgrade options only for students */}
      {isAdmin && <BuyTeamSeats />}
      {isStudent && !isPremium && <PremiumUpgrade />}

      {isStudent && isPremium && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white flex items-center gap-3">
          <Crown className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">You're a Pro member!</p>
            <p className="text-amber-100 text-sm">All courses and features are unlocked. Thank you for your support.</p>
          </div>
        </div>
      )}

      {isStudent && enrollments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-slate-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">Your Learning Progress</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold">{enrollments.length}</p>
              <p className="text-blue-200 text-sm">Enrolled</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{enrollments.filter((e) => e.status === 'in_progress').length}</p>
              <p className="text-blue-200 text-sm">In progress</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{enrollments.filter((e) => e.status === 'completed').length}</p>
              <p className="text-blue-200 text-sm">Completed</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-sm font-medium text-slate-700"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No courses found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const colors = colorClasses[course.thumbnail_color || 'blue'] || colorClasses.blue;
            const enrollment = getEnrollment(course.id);
            const isLocked = isStudent && !isPremium && course.level === 'advanced' && !enrollment;
            return (
              <div
                key={course.id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all text-left overflow-hidden relative flex flex-col"
              >
                {isLocked && <LockedOverlay onUpgrade={() => setShowUpgrade(true)} />}
                <div className="w-full text-left flex-1 flex flex-col">
                  <div 
                    onClick={() => !isLocked && setSelectedCourse(course)}
                    className="h-24 relative flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                  >
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <GraduationCap className="w-10 h-10 text-white/80 relative z-10" />
                    {enrollment && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 rounded-full text-xs font-medium text-slate-700 z-10">
                        {enrollment.progress}% complete
                      </div>
                    )}
                    {course.level === 'advanced' && (
                      <div className="absolute top-3 left-3 z-10"><PremiumBadge /></div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelBadge[course.level] || levelBadge.beginner}`}>{course.level}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{course.category}</span>
                      </div>
                      <h3 
                        onClick={() => !isLocked && setSelectedCourse(course)}
                        className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer"
                      >
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="modules-list mt-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Course Modules</h4>
                      {course.modules && course.modules.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {[...course.modules]
                            .sort((a: Module, b: Module) => a.order_index - b.order_index)
                            .map((module: Module) => {
                              const isModuleLocked = isStudent && !isPremium && !module.is_free_preview && course.level === 'advanced' && !enrollment;
                              return (
                                <div 
                                  key={module.id} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLocked) {
                                      setSelectedModuleId(module.id);
                                      setSelectedCourse(course);
                                    }
                                  }}
                                  className="module-item text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  {module.image_url && (
                                    <img src={module.image_url} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                                  )}
                                  <span className="truncate pr-2 flex-1">{module.order_index}. {module.title}</span>
                                  {module.is_free_preview ? (
                                    <span className="badge shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">Free</span>
                                  ) : isModuleLocked ? (
                                    <span className="badge shrink-0 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">Locked</span>
                                  ) : null}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No modules available yet.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-400 pt-2">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration_hours ?? '—'}h</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.instructor || 'NeuralAcademy'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowUpgrade(false)}>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <PremiumUpgrade onClose={() => setShowUpgrade(false)} />
          </div>
        </div>
      )}

      {showCreateModal && <CreateCourseModal onClose={() => setShowCreateModal(false)} onCreate={createCourse} />}
      {showAICourseModal && (
        <CreateAICourseModal
          onClose={() => setShowAICourseModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

function CreateCourseModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Course>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AI Fundamentals');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [duration, setDuration] = useState(4);
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState('blue');

  const categories = ['AI Fundamentals', 'Deep Learning', 'Business AI', 'NLP', 'AI Ethics', 'Computer Vision', 'Prompt Engineering'];
  const colors = ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange', 'slate'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      category,
      level,
      duration_hours: duration,
      instructor,
      thumbnail_color: color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-900">Create New Course</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Introduction to Deep Learning"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Course description..." rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white">
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (hours)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructor Name</label>
              <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Dr. Sarah Connor"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Accent Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${colorClasses[c].gradient} ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Create Course</button>
          </div>
        </form>
      </div>
    </div>
  );
}
