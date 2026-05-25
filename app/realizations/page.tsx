'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import PageHeader from '@/components/ui/PageHeader';
import { IconPlus, IconClose, IconTrash } from '@/components/ui/Icon';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const fmt = (d: Date) =>
  `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function RealizationsPage() {
  const realizations = useAppStore((s) => s.realizations);
  const addRealization = useAppStore((s) => s.addRealization);
  const deleteRealization = useAppStore((s) => s.deleteRealization);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addRealization({ content: content.trim() });
    setContent('');
    setOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Notes to self"
        title="Realizations"
        subtitle="Observations you want to remember and have the AI use as context."
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconPlus size={13} /> Add
          </button>
        }
      />

      <section className="px-5 pb-10">
        {realizations.length === 0 ? (
          <div className="card p-4 muted text-[13.5px]">
            No realizations yet. Add the first one — even half-formed thoughts help.
          </div>
        ) : (
          <div className="space-y-2">
            {realizations.map((r) => (
              <article key={r.id} className="card p-3.5 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="m-0 ink whitespace-pre-wrap text-[14px]">{r.content}</p>
                  <div className="eyebrow mt-2">{fmt(toDate(r.timestamp))}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this realization?')) deleteRealization(r.id);
                  }}
                  aria-label="Delete"
                  className="muted hover:text-ink self-start"
                >
                  <IconTrash size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="m-0 font-heading text-[22px] tracking-head ink">Add realization</h2>
              <button onClick={() => setOpen(false)} className="muted hover:text-ink" aria-label="Close">
                <IconClose size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="E.g. 'Bloating seems worse after high-fiber meals.'"
                className="w-full px-3 py-2.5 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-full text-[13px]"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="flex-1 px-4 py-2 rounded-full text-[13px] disabled:opacity-50"
                  style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
