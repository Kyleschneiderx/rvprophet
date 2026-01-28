import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Role } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  dealershipId: string;
  status: 'active' | 'inactive';
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role;
  dealershipId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setRole: (role: Role) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'rvprophet_role';
const DEV_DEALERSHIP_ID = 'dev-dealership-001';

// Fetch profile using raw fetch to avoid Supabase client abort issues
async function fetchProfileRaw(userId: string, accessToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,name,email,role,dealership_id,status`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error('[Auth] Profile fetch failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      console.error('[Auth] No profile found');
      return null;
    }

    const row = data[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as Role,
      dealershipId: row.dealership_id,
      status: row.status as 'active' | 'inactive',
    };
  } catch (err) {
    console.error('[Auth] Profile fetch error:', err);
    return null;
  }
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [devRole, setDevRole] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'technician';
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY) as Role | null;
    return stored || 'technician';
  });

  // Initialize auth on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log('[Auth] Supabase not configured, using dev mode');
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        console.log('[Auth] Initializing...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          console.log('[Auth] Found existing session');
          setSession(currentSession);
          setUser(currentSession.user);

          const userProfile = await fetchProfileRaw(currentSession.user.id, currentSession.access_token);
          if (userProfile) {
            setProfile(userProfile);
            console.log('[Auth] Profile loaded:', userProfile.name);
          }
        } else {
          console.log('[Auth] No existing session');
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] State change:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchProfileRaw(newSession.user.id, newSession.access_token);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persist dev role
  useEffect(() => {
    if (!isSupabaseConfigured && typeof window !== 'undefined') {
      window.localStorage.setItem(ROLE_STORAGE_KEY, devRole);
    }
  }, [devRole]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    console.log('[Auth] Signing in:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('[Auth] Sign in failed:', error.message);
        return { error: new Error(error.message) };
      }

      if (!data.session || !data.user) {
        console.error('[Auth] No session returned');
        return { error: new Error('Sign in failed - no session') };
      }

      console.log('[Auth] Sign in successful');

      // Set auth state immediately
      setSession(data.session);
      setUser(data.user);

      // Fetch profile using raw fetch
      const userProfile = await fetchProfileRaw(data.user.id, data.session.access_token);
      if (userProfile) {
        setProfile(userProfile);
        console.log('[Auth] Profile set:', userProfile.name, userProfile.role);
      } else {
        console.warn('[Auth] No profile found');
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Sign in exception:', err);
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;

    console.log('[Auth] Signing out');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const role: Role = isSupabaseConfigured ? (profile?.role ?? 'technician') : devRole;
  const dealershipId = isSupabaseConfigured ? (profile?.dealershipId ?? null) : DEV_DEALERSHIP_ID;
  const isAuthenticated = isSupabaseConfigured ? !!session : true;

  const setRole = (newRole: Role) => {
    if (!isSupabaseConfigured) {
      setDevRole(newRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        dealershipId,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const useRole = () => {
  const { role, setRole } = useAuth();
  return { role, setRole };
};
