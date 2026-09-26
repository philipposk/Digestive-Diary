'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PasswordInput from '@/components/ui/PasswordInput';
import { explainAuthError } from '@/lib/auth-error';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { getSupabaseClient, isCloudEnabled } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabaseClient();
    if (!sb) {
      setChecking(false);
      return;
    }
    void sb.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const sb = getSupabaseClient();
      if (!sb) return;
      if (next.length < MIN_PASSWORD_LENGTH) {
        setProblem(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (next !== again) {
        setProblem('Passwords do not match.');
        return;
      }
      setProblem(null);
      setBusy(true);
      const { error } = await sb.auth.updateUser({ password: next });
      setBusy(false);
      if (error) {
        setProblem(explainAuthError(error));
        return;
      }
      router.replace('/settings');
      router.refresh();
    },
    [next, again, router]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="New password" subtitle="Choose a password for your account." />

      <div className="px-5">
        {!isCloudEnabled() ? (
          <div className="card p-4 text-[13px] ink-soft">Cloud sign-in is not configured.</div>
        ) : checking ? (
          <p className="muted text-[13px]">Checking session…</p>
        ) : !hasSession ? (
          <div className="card p-4 space-y-3">
            <p className="text-[13px] ink-soft m-0">This reset link is expired or invalid. Request a new one from the login page.</p>
            <Link href="/login" className="btn-primary inline-block px-4 py-2 rounded-full text-[13px]">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="card p-4 space-y-3">
            {problem && (
              <p className="text-[13px] m-0" style={{ color: '#c44a4a' }}>
                {problem}
              </p>
            )}
            <form onSubmit={(e) => void save(e)} className="space-y-3" noValidate>
              <div>
                <label htmlFor="reset-new" className="block text-[12px] muted mb-1">New password</label>
                <PasswordInput id="reset-new" autoComplete="new-password" value={next} onChange={setNext} required />
              </div>
              <div>
                <label htmlFor="reset-again" className="block text-[12px] muted mb-1">Confirm password</label>
                <PasswordInput id="reset-again" autoComplete="new-password" value={again} onChange={setAgain} required />
              </div>
              <button type="submit" className="btn-primary w-full py-3 rounded-full text-[14px]" disabled={busy || next === '' || again === ''}>
                {busy ? 'Saving…' : 'Save password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
