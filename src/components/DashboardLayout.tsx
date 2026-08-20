import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Brain, LayoutDashboard, Bot, Building2, ClipboardCheck, Languages, LogOut, Menu, X, GraduationCap, ChevronDown, Eye, Presentation, Activity, KeyRound } from 'lucide-react';
import type { ViewMode } from '@/types';

export type DashboardSection = 'overview' | 'tutor' | 'training' | 'assessment' | 'language' | 'student-dashboard';

interface SidebarProps {
  active: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
}

const studentNav = [
  { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'student-dashboard' as const, label: 'Student Progress', icon: Activity },
  { id: 'tutor' as const, label: 'AI Personal Tutor', icon: Bot },
  { id: 'training' as const, label: 'Training Portal', icon: GraduationCap },
  { id: 'assessment' as const, label: 'Skills Assessment', icon: ClipboardCheck },
  { id: 'language' as const, label: 'Language Coach', icon: Languages },
];

const adminNav = [
  { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'student-dashboard' as const, label: 'Student Progress', icon: Activity },
  { id: 'training' as const, label: 'Training Portal', icon: Building2 },
  { id: 'assessment' as const, label: 'Skills Assessment', icon: ClipboardCheck },
  { id: 'tutor' as const, label: 'AI Personal Tutor', icon: Bot },
  { id: 'language' as const, label: 'Language Coach', icon: Languages },
];

const teacherNav = [
  { id: 'overview' as const, label: 'Teacher Dashboard', icon: LayoutDashboard },
  { id: 'training' as const, label: 'My Courses', icon: Presentation },
  { id: 'assessment' as const, label: 'Assessments', icon: ClipboardCheck },
  { id: 'tutor' as const, label: 'AI Tutor', icon: Bot },
  { id: 'language' as const, label: 'Language Coach', icon: Languages },
];

const viewAccent: Record<ViewMode, string> = {
  student: 'from-blue-500 to-blue-600',
  corporate_admin: 'from-emerald-500 to-emerald-600',
  teacher: 'from-amber-500 to-orange-500',
};

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(newPassword);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500">Enter your new secure password below.</p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center text-emerald-600 font-semibold text-sm">
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ active, onNavigate, children }: SidebarProps & { children: React.ReactNode }) {
  const { profile, signOut, effectiveRole, viewMode, setViewMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const nav = effectiveRole === 'corporate_admin' ? adminNav : effectiveRole === 'teacher' ? teacherNav : studentNav;
  const isAdmin = effectiveRole === 'corporate_admin';
  const isTeacher = effectiveRole === 'teacher';

  const roleLabel = profile?.role 
    ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
    : (isAdmin ? 'Corporate Admin' : isTeacher ? 'Teacher' : 'Student');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
          <div className={`w-9 h-9 bg-gradient-to-br ${viewAccent[effectiveRole]} rounded-lg flex items-center justify-center transition-all`}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">NeuralAcademy</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${viewAccent[effectiveRole]} text-white`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className={`w-9 h-9 bg-gradient-to-br ${viewAccent[effectiveRole]} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 transition-all`}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">
                {roleLabel}
                {isAdmin && profile?.company ? ` · ${profile.company}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <KeyRound className="w-5 h-5" />
            Change Password
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 mt-0.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {nav.find((n) => n.id === active)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {profile?.role === 'corporate_admin' && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-500">View Mode:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="corporate_admin">Corporate Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100"
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${viewAccent[effectiveRole]} rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all`}>
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-40 animate-scale-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{profile?.full_name}</p>
                      <p className="text-xs text-slate-500">{profile?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">Role: {roleLabel}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
