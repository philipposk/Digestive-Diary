'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-36 right-4 z-40 w-10 h-10 rounded-full btn-secondary flex items-center justify-center text-[18px] shadow-md hover:scale-105 transition-transform"
      style={{ border: '1px solid var(--border)' }}
    >
      ↑
    </button>
  );
}
