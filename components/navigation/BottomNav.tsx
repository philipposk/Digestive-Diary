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
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export default function BottomNav() {
  const pathname = usePathname() || '/';
  const { t } = useT();
  const unresolved = useAppStore((s) => s.adminNotifications.filter((n) => !n.resolved).length);

  const navItems = [
    { href: '/',            label: t('nav.today'),    icon: IconBowl,  badge: 0,           match: (p: string) => p === '/' },
    { href: '/timeline',    label: t('nav.timeline'), icon: IconPulse, badge: 0,           match: (p: string) => p.startsWith('/timeline') || p.startsWith('/calendar') },
    { href: '/insights',    label: t('nav.insights'), icon: IconSpark, badge: 0,           match: (p: string) => p.startsWith('/insights') || p.startsWith('/realizations') },
    { href: '/experiments', label: t('nav.lab'),      icon: IconFlask, badge: 0,           match: (p: string) => p.startsWith('/experiments') || p.startsWith('/recipes') || p.startsWith('/sources') || p.startsWith('/macros') || p.startsWith('/factors') },
    { href: '/settings',    label: t('nav.profile'),  icon: IconCog,   badge: unresolved,  match: (p: string) => p.startsWith('/settings') || p.startsWith('/admin') },
  ];

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
                className="relative flex flex-col items-center justify-center gap-[3px] px-2 py-1.5 transition-colors"
                style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
              >
                <Icon size={20} stroke={active ? 2 : 1.5} />
                {item.badge > 0 && (
                  <span
                    aria-label={`${item.badge} unresolved`}
                    className="absolute top-0 right-0 text-[9px] font-mono font-bold rounded-full"
                    style={{
                      background: '#c44a4a',
                      color: '#fff',
                      minWidth: 14,
                      height: 14,
                      padding: '0 4px',
                      lineHeight: '14px',
                      textAlign: 'center',
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
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
