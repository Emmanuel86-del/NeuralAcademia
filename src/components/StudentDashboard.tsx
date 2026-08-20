import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BookOpen, Award, Flame, CheckCircle, Clock, ArrowRight, Users, TrendingUp, BarChart3, ShieldCheck } from 'lucide-react';
import type { Enrollment, LanguageProgress } from '@/types';

export function StudentDashboard() {
  const { profile, effectiveRole } = useAuth();
  const isAdmin = effectiveRole === 'corporate_admin';

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [langProgress, setLangProgress] = useState<LanguageProgress[]>([]);
  
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [totalEnrollmentsCount, setTotalEnrollmentsCount] = useState(0);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;

      if (isAdmin) {
        // Fetch profiles, courses, and enrollments separately to avoid foreign key cache errors
        const [studentsRes, coursesRes, enrollRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, created_at'),
          supabase.from('courses').select('id, title', { count: 'exact' }).eq('is_published', true),
          supabase.from('enrollments').select('id, user_id, progress, status, course_id')
        ]);

        const students = studentsRes.data || [];
        const allEnrollments = enrollRes.data || [];

        // Map enrollments to their respective students safely in memory
        const enrichedStudents = students.map(student => ({
          ...student,
          enrollments: allEnrollments.filter(e => e.user_id === student.id)
        }));

        setAllStudents(enrichedStudents);
        setTotalCoursesCount(coursesRes.count || 0);
        setTotalEnrollmentsCount(allEnrollments.length);
      } else {
        const userId = profile.id;
        const [enrollRes, langRes] = await Promise.all([
          supabase.from('enrollments').select('*, course:courses(*)').eq('user_id', userId),
          supabase.from('language_progress').select('*').eq('user_id', userId),
        ]);

        setEnrollments((enrollRes.data as unknown as Enrollment[]) || []);
        setLangProgress((langRes.data as unknown as LanguageProgress[]) || []);
      }

      setLoading(false);
    }
    loadData();
  }, [profile, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading analytics dashboard...
      </div>
    );
  }

  // ==========================================
  // CORPORATE ADMIN ANALYTICS VIEW
  // ==========================================
  if (isAdmin) {
    const totalStudentsCount = allStudents.length;
    
    let totalProgressSum = 0;
    let totalEnrollmentRecords = 0;
    allStudents.forEach(student => {
      student.enrollments?.forEach((en: any) => {
        totalProgressSum += (en.progress || 0);
        totalEnrollmentRecords++;
      });
    });
    const aggregateCompletionRate = totalEnrollmentRecords > 0 
      ? Math.round(totalProgressSum / totalEnrollmentRecords) 
      : 0;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Corporate Admin Intelligence Suite
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold">Platform Progress & Analytics</h2>
            <p className="text-slate-300 mt-2 max-w-xl text-sm lg:text-base">
              Monitor enterprise-wide learning adoption, aggregate course progress, and individual user metrics across Neural Academy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalStudentsCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">Registered Learners</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalCoursesCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">Published Courses</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalEnrollmentsCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">Total Course Enrollments</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{aggregateCompletionRate}%</p>
            <p className="text-sm text-slate-500 mt-0.5">Avg Progress Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Enterprise Student Roster & Progress
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-3">Learner Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3">Active Course Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-900">{student.full_name || 'Unnamed Learner'}</td>
                    <td className="p-3 text-slate-500">{student.email}</td>
                    <td className="p-3 text-slate-400 text-xs">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {student.enrollments && student.enrollments.length > 0 ? (
                        <div className="space-y-2 py-1">
                          {student.enrollments.map((en: any) => (
                            <div key={en.id} className="flex items-center gap-4 text-xs">
                              <span className="font-medium text-slate-700 w-36 truncate">
                                Enrollment #{en.id.slice(0, 6)}
                              </span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[150px] overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full" 
                                  style={{ width: `${en.progress || 0}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-600">{en.progress || 0}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No course enrollments</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // REGULAR STUDENT PERSONAL VIEW
  // ==========================================
  const completedModules = enrollments.reduce((sum, e) => sum + Math.round((e.progress / 100) * 12), 0);
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;
  const bestStreak = langProgress.reduce((max, l) => Math.max(max, l.streak_days), 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              🚀 ACTIVE LEARNING TIER
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold">Welcome back to Neural Academy!</h2>
            <p className="text-white/80 mt-1 text-sm lg:text-base">
              Track your AI mastery and course progress from one central hub.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-center flex-shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-lg">
              <Flame className="w-5 h-5 fill-emerald-300 text-emerald-300" />
              {bestStreak} Days
            </div>
            <p className="text-xs text-white/70">LEARNING STREAK</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{completedModules}/12</p>
            <p className="text-sm text-slate-500">Modules Completed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{enrollments.length} Active</p>
            <p className="text-sm text-slate-500">Enrolled Courses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
            <p className="text-sm text-slate-500">Overall Course Progress</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-900">Curriculum Completion</span>
          <span className="font-semibold text-purple-600">{avgProgress}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500" 
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Recommended Next Steps</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="font-medium text-slate-800 text-sm">Machine Learning Basics Overview</span>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Completed</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span className="font-medium text-slate-800 text-sm">Deep Learning & Neural Networks Lab</span>
            </div>
            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1">
              In Progress <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;