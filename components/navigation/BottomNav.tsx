'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBowl,
  IconPulse,
  IconSpark,
  IconFlask,
  IconCog,
} from '@/components/ui/Icon';

const navItems = [
  { href: '/',            label: 'Today',     icon: IconBowl,     match: (p: string) => p === '/' },
  { href: '/timeline',    label: 'Timeline',  icon: IconPulse,    match: (p: string) => p.startsWith('/timeline') || p.startsWith('/calendar') },
  { href: '/insights',    label: 'Insights',  icon: IconSpark,    match: (p: string) => p.startsWith('/insights') || p.startsWith('/realizations') },
  { href: '/experiments', label: 'Lab',       icon: IconFlask,    match: (p: string) => p.startsWith('/experiments') || p.startsWith('/recipes') || p.startsWith('/sources') || p.startsWith('/macros') },
  { href: '/settings',    label: 'Profile',   icon: IconCog,      match: (p: string) => p.startsWith('/settings') || p.startsWith('/admin') },
];

export default function BottomNav() {
  const pathname = usePathname() || '/';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: 'linear-gradient(to top, var(--bg) 65%, transparent)',
        borderTop: '1px solid var(--border)',
        paddingTop: 8,
        paddingBottom: 'max(env(safe-area-inset-bottom), 14px)',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-[3px] px-2 py-1.5 transition-colors"
                style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
              >
                <Icon size={20} stroke={active ? 2 : 1.5} />
                <span
                  className="text-[10.5px] font-body"
                  style={{
                    fontWeight: active ? 600 : 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
