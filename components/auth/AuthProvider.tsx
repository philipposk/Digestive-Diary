'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient, isCloudEnabled } from '@/lib/supabase/client';
import { migrateLocalToCloudIfNeeded, pullCloudToLocalIfEmpty } from '@/lib/storageAdapter';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  cloudEnabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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

    sb.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
      if (data.user) {
        migrateLocalToCloudIfNeeded().catch(() => {});
        pullCloudToLocalIfEmpty().catch(() => {});
      }
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        migrateLocalToCloudIfNeeded().catch(() => {});
        pullCloudToLocalIfEmpty().catch(() => {});
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    const redirectTo = `${window.location.origin}/auth/callback`;
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
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
