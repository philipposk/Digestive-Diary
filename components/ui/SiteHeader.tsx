'use client';

import Link from 'next/link';
import GlobalSearch from '@/components/ui/GlobalSearch';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SiteHeader() {
  const { user, cloudEnabled } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <Link href="/" className="font-heading text-[15px] tracking-head ink hover:opacity-80 transition-opacity truncate">
          Digestive Diary
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <GlobalSearch />
          {cloudEnabled && (
            <Link
              href={user ? '/settings' : '/login'}
              className="btn-ghost px-2.5 py-1.5 rounded-full text-[11px] max-w-[120px] truncate"
              style={{ border: '1px solid var(--border)' }}
              title={user?.email ?? 'Sign in'}
            >
              {user ? user.email?.split('@')[0] : 'Sign in'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
