import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bot, GraduationCap, ClipboardCheck, Languages, Award, Flame, ArrowRight, BookOpen, Target, Users, Presentation, Building2, Search, Power } from 'lucide-react';
import type { DashboardSection } from '@/components/DashboardLayout';
import type { Enrollment, AssessmentResult, LanguageProgress, TutorSession, Course } from '@/types';

interface OverviewProps {
  onNavigate: (section: DashboardSection) => void;
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  department: string;
  enrolled_at?: string;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const { profile, effectiveRole } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [langProgress, setLangProgress] = useState<LanguageProgress[]>([]);
  const [tutorSessions, setTutorSessions] = useState<TutorSession[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true); // AI Tutor Master Switch state

  const isAdmin = effectiveRole === 'corporate_admin';
  const isTeacher = effectiveRole === 'teacher';

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      const userId = profile.id;

      // Fetch platform settings toggle state from Supabase
      const { data: settingsData, error: settingsError } = await supabase
        .from('platform_settings')
        .select('ai_tutor_enabled')
        .eq('id', 'global_config')
        .maybeSingle();

      if (settingsError) {
        console.error('Error loading AI switch status:', settingsError.message);
      } else if (settingsData && typeof settingsData.ai_tutor_enabled === 'boolean') {
        setAiEnabled(settingsData.ai_tutor_enabled);
      }

      const queries = [
        supabase.from('enrollments').select('*, course:courses(*)').eq('user_id', userId),
        supabase.from('assessment_results').select('*, assessment:assessments(*)').eq('user_id', userId).order('taken_at', { ascending: false }),
        supabase.from('language_progress').select('*').eq('user_id', userId),
        supabase.from('tutor_sessions').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ];
      const [enrollRes, resultRes, langRes, tutorRes, courseRes] = await Promise.all(queries);

      setEnrollments((enrollRes.data as unknown as Enrollment[]) || []);
      setResults((resultRes.data as unknown as AssessmentResult[]) || []);
      setLangProgress((langRes.data as unknown as LanguageProgress[]) || []);
      setTutorSessions((tutorRes.data as unknown as TutorSession[]) || []);
      setTotalCourses(courseRes.count || 0);

      if (isTeacher || isAdmin) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (profileData && profileData.length > 0) {
          setStudents(profileData);
        } else {
          setStudents([
            { id: '1', full_name: 'Alice Wanjiku', email: 'alice@example.com', department: 'Computer Science', enrolled_at: '2026-08-01' },
            { id: '2', full_name: 'Brian Kiprono', email: 'brian@example.com', department: 'Information Technology', enrolled_at: '2026-08-03' },
            { id: '3', full_name: 'Cynthia Akinyi', email: 'cynthia@example.com', department: 'Software Engineering', enrolled_at: '2026-08-05' },
            { id: '4', full_name: 'Daniel Ochieng', email: 'daniel@example.com', department: 'Computer Science', enrolled_at: '2026-08-10' },
          ]);
        }
      }

      setLoading(false);
    }
    loadData();
  }, [profile, isTeacher, isAdmin]);

  // Handler to update database when the switch is toggled.
  // Uses upsert instead of update: if the `global_config` row doesn't
  // exist yet, a plain update() matches zero rows and silently no-ops —
  // which was the actual bug (the toggle looked like it worked because
  // the local state flipped, but nothing was ever written to the DB, so
  // every other page kept reading the old/default value).
  const handleToggleAi = async () => {
    const newState = !aiEnabled;
    setAiEnabled(newState); // Optimistic UI update

    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        { id: 'global_config', ai_tutor_enabled: newState, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating AI switch status:', error.message);
      setAiEnabled(!newState); // Revert back if DB update fails
    }
  };

  const inProgressCourses = enrollments.filter((e) => e.status === 'in_progress').length;
  const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.total_questions) * 100, 0) / results.length)
    : 0;
  const totalXP = langProgress.reduce((sum, l) => sum + l.xp_points, 0);
  const bestStreak = langProgress.reduce((max, l) => Math.max(max, l.streak_days), 0);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.department?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const departmentCounts = students.reduce((acc: Record<string, number>, student) => {
    const dept = student.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const sections = [
    {
      id: 'training' as const,
      title: isTeacher ? 'My Courses' : isAdmin ? 'Corporate Training Portal' : 'Training Portal',
      description: isTeacher ? 'Manage your course content and lessons' : isAdmin ? 'Manage courses and track team progress' : 'Browse and enroll in AI training courses',
      icon: isTeacher ? Presentation : isAdmin ? Users : GraduationCap, color: 'emerald',
      stat: `${totalCourses} courses`,
    },
    {
      id: 'tutor' as const, title: 'AI Personal Tutor', description: 'Chat with an AI tutor about ML, NLP, neural networks, and more', icon: Bot, color: 'blue',
      stat: tutorSessions.length > 0 ? `${tutorSessions.length} sessions` : 'Start learning',
    },
    {
      id: 'assessment' as const, title: 'Skills Assessment Engine', description: isTeacher ? 'Create and review student assessments' : 'Test your knowledge with interactive AI quizzes', icon: ClipboardCheck, color: 'amber',
      stat: results.length > 0 ? `${results.length} taken` : 'Take a quiz',
    },
    {
      id: 'language' as const, title: 'AI Language Coach', description: 'Learn languages with AI-powered flashcards and lessons', icon: Languages, color: 'rose',
      stat: langProgress.length > 0 ? `${totalXP} XP` : 'Start learning',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-rose-600' },
  };

  const stats = [
    { label: 'Courses in progress', value: inProgressCourses, icon: BookOpen, color: 'blue' },
    { label: 'Courses completed', value: completedCourses, icon: Award, color: 'emerald' },
    { label: 'Avg assessment score', value: `${avgScore}%`, icon: Target, color: 'amber' },
    { label: 'Language streak', value: `${bestStreak} days`, icon: Flame, color: 'rose' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-gradient-to-br ${isTeacher ? 'from-purple-600 to-indigo-800' : isAdmin ? 'from-emerald-600 to-slate-900' : 'from-blue-600 to-slate-900'} rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">Welcome back,</p>
          <h2 className="text-2xl lg:text-3xl font-bold">{profile?.full_name || 'Learner'}</h2>
          <p className="text-white/80 mt-2 max-w-lg">
            {isTeacher
              ? `You have ${students.length} active students enrolled across different departments.`
              : isAdmin
                ? `Manage your organization's AI training programs, create courses, and track learner progress.`
                : `Continue your AI learning journey. You have ${inProgressCourses} course${inProgressCourses !== 1 ? 's' : ''} in progress and ${results.length} assessment${results.length !== 1 ? 's' : ''} completed.`}
          </p>
        </div>
      </div>

      {/* AI Tutor Master Control Switch (Visible to Teachers & Admins Only) */}
      {(isTeacher || isAdmin) && (
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-sm">
          <div>
            <span className="text-sm font-bold block">AI Tutor Exam Switch</span>
            <span className="text-xs text-slate-400">
              {aiEnabled ? 'Status: ON (Accessible to students)' : 'Status: OFF (Exam lock active)'}
            </span>
          </div>
          <button
            onClick={handleToggleAi}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              aiEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            {aiEnabled ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      )}

      {isTeacher && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" /> Enrolled Students & Departments
            </h3>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
              Total Enrolled: {students.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(departmentCounts).map(([dept, count]) => (
              <div key={dept} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Department</span>
                  <h4 className="text-md font-bold text-slate-800">{dept}</h4>
                </div>
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                  {count}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h4 className="font-bold text-slate-800">Student Directory</h4>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or dept..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400">No students found.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-6 font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {student.full_name?.charAt(0) || 'S'}
                          </div>
                          {student.full_name}
                        </td>
                        <td className="py-3 px-6 text-slate-500">{student.email}</td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            <Building2 className="w-3 h-3" />
                            {student.department || 'General'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && !isAdmin && !isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const c = colorMap[stat.color];
            return (
              <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Learning Hub</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const c = colorMap[section.color];
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{section.title}</h4>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                    <span className={`inline-flex items-center gap-1 mt-3 text-xs font-medium ${c.text} ${c.bg} px-2.5 py-1 rounded-full`}>
                      {section.stat}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
