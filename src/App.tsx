import { useEffect, useState } from 'react';
import { StudentDashboard } from '@/components/StudentDashboard';
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import DashboardLayout, { type DashboardSection } from '@/components/DashboardLayout';
import Overview from '@/components/sections/Overview';
import PersonalTutor from '@/components/sections/PersonalTutor';
import TrainingPortal from '@/components/sections/TrainingPortal';
import SkillsAssessment from '@/components/sections/SkillsAssessment';
import LanguageCoach from '@/components/sections/LanguageCoach';

type ExtendedSection = DashboardSection | 'student-dashboard';

const SECTIONS: ExtendedSection[] = ['overview', 'tutor', 'training', 'assessment', 'language', 'student-dashboard'];

// Reads the current section out of the URL hash (e.g. "#/training" -> "training").
// Falls back to 'overview' for anything unrecognized, which safely covers the
// empty hash on first load and also a Supabase auth hash like
// "#access_token=...&type=recovery" (it just won't match any known section).
function sectionFromHash(): ExtendedSection {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return (SECTIONS as string[]).includes(raw) ? (raw as ExtendedSection) : 'overview';
}

function PasswordRecoveryModal() {
  const { updatePassword, signOut } = useAuth();
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
    const { error: updateErr } = await updatePassword(newPassword);
    setLoading(false);

    if (updateErr) {
      setError(updateErr);
    } else {
      setSuccess(true);
      // Clean URL hash
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Set New Password</h3>
            <p className="text-xs text-slate-500">You arrived via a password reset link.</p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="text-sm font-semibold text-slate-800">Password updated successfully!</p>
            <p className="text-xs text-slate-500">Reloading your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [section, setSection] = useState<ExtendedSection>(sectionFromHash);
  const { isPasswordRecovery } = useAuth(); // Use state from AuthContext

  // Keep the URL hash in sync with the active section, so the browser's
  // Back/Forward buttons move between sections of the app instead of
  // leaving it entirely. Previously nothing ever changed the URL, so
  // there was no in-app history for Back to step through — it skipped
  // straight past the whole app.
  useEffect(() => {
    // While a password-recovery hash (#access_token=...&type=recovery) is
    // being handled, leave the URL alone — PasswordRecoveryModal cleans
    // that up itself once the password update succeeds.
    if (isPasswordRecovery) return;

    // Establish a baseline history entry for whatever section we're
    // already showing, without adding an extra entry to the stack.
    window.history.replaceState({ section }, '', `#/${section}`);

    function handlePopState(event: PopStateEvent) {
      const next = (event.state?.section as ExtendedSection | undefined) ?? sectionFromHash();
      setSection(next);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPasswordRecovery]);

  function navigate(next: ExtendedSection) {
    setSection((current) => {
      if (next !== current) {
        window.history.pushState({ section: next }, '', `#/${next}`);
      }
      return next;
    });
  }

  return (
    <>
      {isPasswordRecovery && <PasswordRecoveryModal />}
      <DashboardLayout active={section as DashboardSection} onNavigate={(s) => navigate(s as ExtendedSection)}>
        {section === 'overview' && <Overview onNavigate={navigate} />}
        {section === 'tutor' && <PersonalTutor />}
        {section === 'training' && <TrainingPortal />}
        {section === 'assessment' && <SkillsAssessment />}
        {section === 'language' && <LanguageCoach />}
        {section === 'student-dashboard' && <StudentDashboard />}
      </DashboardLayout>
    </>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">Your profile is still loading.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
