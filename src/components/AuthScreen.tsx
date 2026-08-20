import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Brain, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, Shield, GraduationCap, BookOpen, ArrowLeft } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'forgot';
type UserRole = 'student' | 'teacher' | 'corporate_admin';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, selectedRole, '');
        if (error) setError(error);
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error);
        } else {
          setSuccessMessage('Password recovery email sent! Check your inbox for the link.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">NeuralAcademy</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Master AI with personalized learning experiences
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              From 1-on-1 AI tutoring to corporate training programs, skills assessments, and language coaching — all in one platform.
            </p>
            <div className="space-y-3 pt-4">
              {[
                'AI Personal Tutor with adaptive learning',
                'Corporate training portal with progress tracking',
                'Skills assessments with instant scoring',
                'AI-powered language learning coach',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                  <span className="text-blue-50">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-200 text-sm">Trusted by learners and teams worldwide</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">NeuralAcademy</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Learning
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="text-slate-500 mt-1.5">
              {mode === 'signin' && 'Sign in to continue your learning journey'}
              {mode === 'signup' && 'Start learning AI today — it takes less than a minute'}
              {mode === 'forgot' && 'Enter your email address and we will send you a link to reset your password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Account Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      onClick={() => setSelectedRole('student')}
                      className={`cursor-pointer flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedRole === 'student'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mb-1 text-blue-600" />
                      Student
                    </div>

                    <div
                      onClick={() => setSelectedRole('teacher')}
                      className={`cursor-pointer flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedRole === 'teacher'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 mb-1 text-blue-600" />
                      Teacher
                    </div>

                    <div
                      onClick={() => setSelectedRole('corporate_admin')}
                      className={`cursor-pointer flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedRole === 'corporate_admin'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Shield className="w-4 h-4 mb-1 text-blue-600" />
                      Admin
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode !== 'forgot' && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign in
              </button>
            )}
          </form>

          {mode !== 'forgot' && (
            <p className="text-center text-sm text-slate-500 mt-6">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}