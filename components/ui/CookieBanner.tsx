'use client';

import { useEffect, useState } from 'react';

const KEY = 'cookie-consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(KEY, 'essential-only');
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[60] px-4 pb-2 pointer-events-none"
      role="region"
      aria-label="Cookie consent"
    >
      <div
        className="card max-w-2xl mx-auto p-4 pointer-events-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        <p className="text-[13px] ink-soft m-0 mb-3">
          We use essential cookies for sign-in and preferences. Optional analytics are off by default.
          See our{' '}
          <a href="/privacy" className="text-accent underline">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={accept} className="btn-primary px-4 py-2 rounded-full text-[12.5px]">
            Accept
          </button>
          <button type="button" onClick={decline} className="btn-secondary px-4 py-2 rounded-full text-[12.5px]">
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
