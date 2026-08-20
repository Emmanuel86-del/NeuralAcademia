import { useState } from 'react';
import { StudentDashboard } from '@/components/StudentDashboard';
import { AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import DashboardLayout, { type DashboardSection } from '@/components/DashboardLayout';
import Overview from '@/components/sections/Overview';
import PersonalTutor from '@/components/sections/PersonalTutor';
import TrainingPortal from '@/components/sections/TrainingPortal';
import SkillsAssessment from '@/components/sections/SkillsAssessment';
import LanguageCoach from '@/components/sections/LanguageCoach';

// Extend or include 'student-dashboard' in your sections type if handled locally, 
// or ensure DashboardSection allows it.
type ExtendedSection = DashboardSection | 'student-dashboard';

function Dashboard() {
  const [section, setSection] = useState<ExtendedSection>('overview');

  return (
    <DashboardLayout active={section as DashboardSection} onNavigate={(s) => setSection(s as ExtendedSection)}>
      {section === 'overview' && <Overview onNavigate={setSection} />}
      {section === 'tutor' && <PersonalTutor />}
      {section === 'training' && <TrainingPortal />}
      {section === 'assessment' && <SkillsAssessment />}
      {section === 'language' && <LanguageCoach />}
      {section === 'student-dashboard' && <StudentDashboard />}
    </DashboardLayout>
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
          <p className="text-xs text-slate-500">If this persists, try signing out and back in.</p>
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