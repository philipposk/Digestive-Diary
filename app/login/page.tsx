'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/components/auth/AuthProvider';
function LoginContent() {
  const { user, loading, cloudEnabled, signInWithGoogle, signOut } = useAuth();
  const params = useSearchParams();
  const error = params.get('error');

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="Sign in" subtitle="Sync your diary across devices. Not medical advice." />

      <div className="px-5 space-y-4">
        {!cloudEnabled && (
          <div className="card p-4 text-[13px] ink-soft">
            Cloud sign-in is not configured yet. Set{' '}
            <code className="font-mono text-[12px]">NEXT_PUBLIC_USE_CLOUD=true</code> and Supabase keys in{' '}
            <code className="font-mono text-[12px]">.env.local</code>. The app works fully offline until then.
          </div>
        )}

        {error && (
          <p className="text-[13px] m-0" style={{ color: '#c44a4a' }}>
            Sign-in failed. Please try again.
          </p>
        )}

        {loading ? (
          <p className="muted text-[13px]">Checking session…</p>
        ) : user ? (
          <div className="card p-4 space-y-3">
            <p className="text-[14px] ink m-0">Signed in as <strong>{user.email}</strong></p>
            <p className="text-[12.5px] muted m-0">
              Your local logs will sync to your account on this device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="btn-primary px-4 py-2 rounded-full text-[13px]">
                Go to Today
              </Link>
              <button type="button" onClick={() => signOut()} className="btn-secondary px-4 py-2 rounded-full text-[13px]">
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-4 space-y-3">
            <p className="text-[13px] ink-soft m-0">
              Sign in with Google to back up and access your diary on any device.
            </p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={!cloudEnabled}
              className="btn-primary w-full py-3 rounded-full text-[14px] disabled:opacity-50"
            >
              Continue with Google
            </button>
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
