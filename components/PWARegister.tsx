'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    setDismissed(localStorage.getItem('pwa-install-dismissed') === 'true');
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installEvent || dismissed) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-40 card p-3"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
    >
      <div className="eyebrow mb-1">Install</div>
      <p className="text-[12.5px] ink-soft m-0 mb-2">
        Add Digestive Diary to your home screen for quicker access and offline use.
      </p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const ev = installEvent;
            setInstallEvent(null);
            try { await ev.prompt(); } catch { /* ignore */ }
          }}
          className="px-3 py-1.5 rounded-full text-[12px]"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Install
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem('pwa-install-dismissed', 'true');
          }}
          className="px-3 py-1.5 rounded-full text-[12px]"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
