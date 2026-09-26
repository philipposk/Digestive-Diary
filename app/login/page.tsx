'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PasswordInput from '@/components/ui/PasswordInput';
import { useAuth } from '@/components/auth/AuthProvider';
import { explainAuthError } from '@/lib/auth-error';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { safeNext } from '@/lib/safe-next';
import { getSupabaseClient } from '@/lib/supabase/client';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 shrink-0">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.86c2.26-2.09 3.57-5.17 3.57-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.31c-.25-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.22 0 10.06 0 12s.47 3.78 1.29 5.4l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z" />
    </svg>
  );
}

function LoginContent() {
  const { user, loading, cloudEnabled, signOut } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const handoffError = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [creating, setCreating] = useState(() => params.get('mode') === 'create');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [signUpTo, setSignUpTo] = useState<string | null>(null);
  const [resetTo, setResetTo] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(handoffError);
  const [busy, setBusy] = useState<
    'google' | 'email' | 'password' | 'reset' | 'code' | 'signup' | null
  >(null);

  useEffect(() => {
    if (loading || !user) return;
    router.replace(next);
  }, [loading, user, next, router]);

  const callbackUrl = useCallback(
    () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    [next]
  );

  const requireClient = () => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Cloud sign-in is not configured.');
    return sb;
  };

  const withGoogle = async () => {
    setProblem(null);
    setBusy('google');
    try {
      const { error } = await requireClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl() },
      });
      if (error) {
        setProblem(explainAuthError(error));
        setBusy(null);
      }
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'Sign-in failed');
      setBusy(null);
    }
  };

  const withEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    setProblem(null);
    setBusy('email');
    const { error } = await requireClient().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
    });
    setBusy(null);
    if (error) {
      setProblem(explainAuthError(error));
      return;
    }
    setSentTo(address);
  };

  const withPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address || password === '') return;
    setProblem(null);
    setBusy('password');
    const { error } = await requireClient().auth.signInWithPassword({ email: address, password });
    if (error) {
      setBusy(null);
      setProblem(explainAuthError(error, undefined, 'passwordWrong'));
      return;
    }
    router.replace(next);
    router.refresh();
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address || password.length < MIN_PASSWORD_LENGTH) {
      setProblem(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }
    setProblem(null);
    setBusy('signup');
    const { data, error } = await requireClient().auth.signUp({
      email: address,
      password,
      options: { emailRedirectTo: callbackUrl() },
    });
    setBusy(null);
    if (error) {
      setProblem(explainAuthError(error));
      return;
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setProblem('An account with this email may already exist. Try signing in instead.');
      return;
    }
    setSignUpTo(address);
  };

  const withCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = signUpTo ?? sentTo;
    const token = code.trim();
    if (!target || token === '') return;
    setProblem(null);
    setBusy('code');
    const { error } = await requireClient().auth.verifyOtp({
      email: target,
      token,
      type: signUpTo ? 'signup' : 'email',
    });
    if (error) {
      setBusy(null);
      setProblem(explainAuthError(error, undefined, 'codeWrong'));
      return;
    }
    router.replace(next);
    router.refresh();
  };

  const sendReset = async () => {
    const address = email.trim();
    if (!address) return;
    setProblem(null);
    setBusy('reset');
    const { error } = await requireClient().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(null);
    if (error) {
      setProblem(explainAuthError(error));
      return;
    }
    setResetTo(address);
  };

  const codeForm = (
    <form onSubmit={(e) => void withCode(e)} className="space-y-3" noValidate>
      <div>
        <label htmlFor="login-code" className="block text-[12px] muted mb-1">
          Code from email
        </label>
        <input
          id="login-code"
          className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none font-mono tracking-widest"
          style={{ border: '1px solid var(--border)' }}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="text-[12px] muted mt-1">Use this if the link opened in a different app.</p>
      </div>
      <button type="submit" className="btn-primary w-full py-3 rounded-full text-[14px]" disabled={busy !== null || code.trim() === ''}>
        {busy === 'code' ? 'Checking…' : 'Confirm code'}
      </button>
    </form>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="Sign in" subtitle="Sync your diary across devices. Not medical advice." />

      <div className="px-5 space-y-4">
        {!cloudEnabled && (
          <div className="card p-4 text-[13px] ink-soft">
            Cloud sign-in is not configured. Set{' '}
            <code className="font-mono text-[12px]">NEXT_PUBLIC_USE_CLOUD=true</code> and Supabase keys in{' '}
            <code className="font-mono text-[12px]">.env.local</code>.
          </div>
        )}

        {problem && (
          <p className="text-[13px] m-0 card p-3" style={{ color: '#c44a4a' }}>
            {problem}
          </p>
        )}

        {loading ? (
          <p className="muted text-[13px]">Checking session…</p>
        ) : user ? (
          <div className="card p-4 space-y-3">
            <p className="text-[14px] ink m-0">
              Signed in as <strong>{user.email}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={next} className="btn-primary px-4 py-2 rounded-full text-[13px]">
                Continue
              </Link>
              <button type="button" onClick={() => void signOut()} className="btn-secondary px-4 py-2 rounded-full text-[13px]">
                Sign out
              </button>
            </div>
          </div>
        ) : signUpTo ? (
          <div className="card p-4 space-y-3">
            <h2 className="text-[16px] font-heading m-0">Check your email</h2>
            <p className="text-[13px] ink-soft m-0">We sent a confirmation to {signUpTo}. Open the link or enter the code below.</p>
            {codeForm}
            <button type="button" className="btn-secondary w-full py-2 rounded-full text-[13px]" onClick={() => { setSignUpTo(null); setCreating(false); setProblem(null); }}>
              Back
            </button>
          </div>
        ) : resetTo ? (
          <div className="card p-4 space-y-3">
            <h2 className="text-[16px] font-heading m-0">Reset email sent</h2>
            <p className="text-[13px] ink-soft m-0">If {resetTo} has an account, you will get a reset link shortly. Check spam too.</p>
            <button type="button" className="btn-secondary w-full py-2 rounded-full text-[13px]" onClick={() => { setResetTo(null); setProblem(null); }}>
              Back
            </button>
          </div>
        ) : sentTo ? (
          <div className="card p-4 space-y-3">
            <h2 className="text-[16px] font-heading m-0">Check your email</h2>
            <p className="text-[13px] ink-soft m-0">We sent a sign-in link to {sentTo}. Or enter the code from the email.</p>
            {codeForm}
            <button type="button" className="btn-secondary w-full py-2 rounded-full text-[13px]" onClick={() => { setSentTo(null); setCode(''); setProblem(null); }}>
              Back
            </button>
          </div>
        ) : (
          <div className="card p-4 space-y-4">
            <button
              type="button"
              onClick={() => void withGoogle()}
              disabled={!cloudEnabled || busy !== null}
              className="btn-primary w-full py-3 rounded-full text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <GoogleMark />
              {busy === 'google' ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 text-[12px] muted">
              <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              or use email
              <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <form
              onSubmit={(e) => {
                if (creating) void signUp(e);
                else if (mode === 'password') void withPassword(e);
                else void withEmail(e);
              }}
              className="space-y-3"
              noValidate
            >
              <div>
                <label htmlFor="login-email" className="block text-[12px] muted mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </div>

              {(creating || mode === 'password') && (
                <div>
                  <label htmlFor="login-password" className="block text-[12px] muted mb-1">Password</label>
                  <PasswordInput
                    id="login-password"
                    autoComplete={creating ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={setPassword}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!cloudEnabled || busy !== null || email.trim() === '' || ((creating || mode === 'password') && password === '')}
                className="btn-secondary w-full py-3 rounded-full text-[14px] disabled:opacity-50"
              >
                {busy !== null
                  ? 'Working…'
                  : creating
                    ? 'Create account'
                    : mode === 'password'
                      ? 'Sign in with password'
                      : 'Email me a sign-in link'}
              </button>

              <div className="flex flex-wrap justify-between gap-2 text-[12px]">
                <button
                  type="button"
                  className="muted hover:text-ink"
                  disabled={busy !== null}
                  onClick={() => {
                    setProblem(null);
                    setPassword('');
                    if (creating) {
                      setCreating(false);
                      return;
                    }
                    setMode(mode === 'password' ? 'link' : 'password');
                  }}
                >
                  {creating ? 'Already have an account?' : mode === 'password' ? 'Use email link instead' : 'Use password instead'}
                </button>

                {!creating && mode === 'password' ? (
                  <button type="button" className="muted hover:text-ink" disabled={busy !== null || email.trim() === ''} onClick={() => void sendReset()}>
                    {busy === 'reset' ? 'Sending…' : 'Forgot password?'}
                  </button>
                ) : !creating ? (
                  <button type="button" className="muted hover:text-ink" disabled={busy !== null} onClick={() => { setProblem(null); setCreating(true); }}>
                    Create account
                  </button>
                ) : null}
              </div>
            </form>

            <Link href="/" className="block text-center text-[12.5px] muted hover:text-ink">
              Continue without account →
            </Link>
          </div>
        )}

        <p className="text-[11.5px] muted text-center">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-5 muted">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
