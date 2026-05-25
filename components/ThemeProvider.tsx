'use client';

import { useEffect } from 'react';
import { applyTheme, getTheme } from '@/lib/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getTheme());

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getTheme() === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);

    // Re-apply when other tabs / settings page change tokens
    const onStorage = (e: StorageEvent) => {
      if (!e.key || ['theme', 'theme-vibe', 'theme-accent'].includes(e.key)) {
        applyTheme();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <>{children}</>;
}
