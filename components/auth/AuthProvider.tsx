'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isCloudEnabled } from '@/lib/supabase/client';
import { syncOnSignIn, setSyncUserId } from '@/lib/sync/cloudSync';
import { safeNext } from '@/lib/safe-next';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  cloudEnabled: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: (next?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const cloudEnabled = isCloudEnabled();

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user ?? null);
      setLoading(false);
      if (data.user) syncOnSignIn(data.user.id).catch((e) => console.warn('sync:', e));
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncOnSignIn(session.user.id).catch((e) => console.warn('sync:', e));
      } else {
        setSyncUserId(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (next = '/settings') => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Cloud sign-in is not configured.');
    const safe = safeNext(next);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safe)}`;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      console.error('[auth] Google sign-in:', error.message);
      throw error;
    }
  }, []);

  const signOut = useCallback(async (next = '/') => {
    setSyncUserId(null);
    setUser(null);
    const safe = safeNext(next);
    await fetch(`/auth/signout?next=${encodeURIComponent(safe)}`, { method: 'POST' });
    window.location.href = safe;
  }, []);

  const value = useMemo(
    () => ({ user, loading, cloudEnabled, signInWithGoogle, signOut }),
    [user, loading, cloudEnabled, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
