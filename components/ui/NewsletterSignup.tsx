'use client';

import { useEffect, useState } from 'react';

const KEY = 'newsletter-subscribed';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) {
      setDone(true);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem(KEY, email.trim());
    setDone(true);
  };

  if (done) {
    return (
      <div className="card p-4 text-center" role="status">
        <p className="text-[14px] ink m-0 font-medium">You&apos;re on the list.</p>
        <p className="text-[12.5px] muted mt-1 mb-0">We&apos;ll email you about major updates only.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <p className="text-[13px] ink-soft m-0">
        Get occasional product updates. No spam. Stored locally until we add a mailing list backend.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
          style={{ border: '1px solid var(--border)' }}
        />
        <button type="submit" className="btn-primary px-4 py-2 rounded-full text-[13px] whitespace-nowrap">
          Subscribe
        </button>
      </div>
    </form>
  );
}
