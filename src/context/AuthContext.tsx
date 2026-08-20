import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, ViewMode } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  effectiveRole: ViewMode;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'corporate_admin', company?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('student');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const isCorporateAdmin = profile?.role === 'corporate_admin';
  const effectiveRole: ViewMode = isCorporateAdmin ? viewMode : ((profile?.role as ViewMode) || 'student');

  const setViewMode = (mode: ViewMode) => {
    if (profile?.role === 'corporate_admin') {
      setViewModeState(mode);
    } else {
      console.warn('Unauthorized view mode switch blocked.');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('getSession error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error.message);
        setProfile(null);
      } else {
        const fetchedProfile = data as Profile | null;
        setProfile(fetchedProfile);
        if (fetchedProfile?.role) {
          setViewModeState(fetchedProfile.role as ViewMode);
        }
      }
    } catch (err) {
      console.error('Profile load exception:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function signUp(email: string, password: string, fullName: string, role: 'student' | 'corporate_admin', company?: string) {
    let data: { user: User | null; session: Session | null } = { user: null, session: null };
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, company: company || '' },
        },
      });
      data = result.data;
      if (result.error) return { error: result.error.message };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed. Please check your connection and try again.' };
    }

    if (data.user) {
      let profileData: Profile | null = null;
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: fetched, error: fetchErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          if (fetchErr) break;
          if (fetched) {
            profileData = fetched as Profile;
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!profileData) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          });
          const { data: fallback } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          profileData = fallback as Profile | null;
        }
      } catch (err) {
        console.error('Profile provisioning exception during signup:', err);
      }

      setProfile(profileData);
      setUser(data.user);
      setSession(data.session);
      if (profileData?.role) {
        setViewModeState(profileData.role as ViewMode);
      }
      setLoading(false);
    }

    return { error: null };
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed. Please try again.' };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
    setIsPasswordRecovery(false);
    setViewModeState('student');
  }

  async function refreshProfile() {
    if (!user) return;
    await loadProfile(user.id);
  }

  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Password reset failed. Please try again.' };
    }
  }

  async function updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      setIsPasswordRecovery(false);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update password.' };
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, profile, session, loading, viewMode, setViewMode, effectiveRole, 
      isPasswordRecovery, signUp, signIn, signOut, refreshProfile, resetPassword, updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}