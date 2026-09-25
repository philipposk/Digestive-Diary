'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { IconSearch } from '@/components/ui/Icon';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const router = useRouter();

  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const experiments = useAppStore((s) => s.experiments);
  const realizations = useAppStore((s) => s.realizations);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return null;
    const match = (s: string) => s.toLowerCase().includes(q);
    return {
      foods: foodLogs.filter((f) => match(f.food) || f.tags?.some(match)).slice(0, 5),
      symptoms: symptoms.filter((s) => match(s.type) || (s.notes && match(s.notes))).slice(0, 5),
      experiments: experiments.filter((e) => match(e.name) || match(e.notes ?? '')).slice(0, 3),
      realizations: realizations.filter((r) => match(r.content)).slice(0, 3),
    };
  }, [debounced, foodLogs, symptoms, experiments, realizations]);

  const pages = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    const routes = [
      { href: '/', label: 'Today' },
      { href: '/timeline', label: 'Timeline' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/insights', label: 'Insights' },
      { href: '/experiments', label: 'Experiments' },
      { href: '/recipes', label: 'Recipes' },
      { href: '/chat', label: 'AI Chat' },
      { href: '/settings', label: 'Settings' },
      { href: '/help', label: 'Help & FAQ' },
      { href: '/report', label: 'Doctor Report' },
    ];
    return routes.filter((r) => r.label.toLowerCase().includes(q));
  }, [debounced]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] muted hover:text-ink transition-colors"
        aria-label="Open search"
        style={{ border: '1px solid var(--border)' }}
      >
        <IconSearch size={14} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline font-mono text-[10px] opacity-60">⌘K</kbd>
      </button>

      {open && (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Site search"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-app">
          <IconSearch size={16} className="muted flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs, pages…"
            className="flex-1 bg-transparent outline-none text-[14px] ink py-1"
          />
          <button type="button" onClick={() => setOpen(false)} className="muted hover:text-ink text-[12px] px-2">
            Esc
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2 space-y-3">
          {pages.length > 0 && (
            <Section title="Pages">
              {pages.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md hover:bg-surf-alt text-[13px] ink"
                >
                  {p.label}
                </Link>
              ))}
            </Section>
          )}
          {results && (
            <>
              {results.foods.length > 0 && (
                <Section title="Food">
                  {results.foods.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setOpen(false); router.push('/timeline'); }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-surf-alt text-[13px] ink"
                    >
                      {f.food}
                    </button>
                  ))}
                </Section>
              )}
              {results.symptoms.length > 0 && (
                <Section title="Symptoms">
                  {results.symptoms.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setOpen(false); router.push('/timeline'); }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-surf-alt text-[13px] ink"
                    >
                      {s.type} · severity {s.severity}
                    </button>
                  ))}
                </Section>
              )}
              {results.experiments.length > 0 && (
                <Section title="Experiments">
                  {results.experiments.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => { setOpen(false); router.push('/experiments'); }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-surf-alt text-[13px] ink"
                    >
                      {e.name}
                    </button>
                  ))}
                </Section>
              )}
              {debounced.trim() && (
                <Link
                  href={`/chat?query=${encodeURIComponent(debounced)}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-[12.5px] text-accent"
                >
                  Ask the diary about &quot;{debounced}&quot; →
                </Link>
              )}
            </>
          )}
          {debounced.trim() && results &&
            results.foods.length === 0 &&
            results.symptoms.length === 0 &&
            results.experiments.length === 0 &&
            pages.length === 0 && (
              <p className="px-3 py-4 text-[13px] muted m-0">No results found.</p>
            )}
        </div>
      </div>
    </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow px-3 mb-1">{title}</div>
      {children}
    </div>
  );
}
