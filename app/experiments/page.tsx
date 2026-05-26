'use client';

import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ExperimentLogType, FodmapPhase, FodmapState } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import AIAnnotation from '@/components/ui/AIAnnotation';
import { IconPlus, IconClose } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const daysBetween = (start: Date | string, end?: Date | string) => {
  const s = toDate(start).getTime();
  const e = end ? toDate(end).getTime() : Date.now();
  return Math.max(1, Math.ceil((e - s) / 86_400_000));
};
const fmtDate = (d: Date | string) =>
  toDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function ExperimentsPage() {
  const { t } = useT();
  const experiments = useAppStore((s) => s.experiments);
  const symptoms = useAppStore((s) => s.symptoms);
  const addExperiment = useAppStore((s) => s.addExperiment);
  const updateExperiment = useAppStore((s) => s.updateExperiment);
  const endExperiment = useAppStore((s) => s.endExperiment);
  const addExperimentLog = useAppStore((s) => s.addExperimentLog);
  const deleteExperimentLog = useAppStore((s) => s.deleteExperimentLog);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState(30);
  const [newNotes, setNewNotes] = useState('');

  const [expanded, setExpanded] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logType, setLogType] = useState<ExperimentLogType>('text');
  const [logContent, setLogContent] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const active = experiments.find((e) => e.active);
  const past = experiments.filter((e) => !e.active);

  // For the active experiment compare symptom counts during vs equal-length prior window.
  const compare = useMemo(() => {
    if (!active) return null;
    const startMs = toDate(active.startDate).getTime();
    const endMs = active.endDate ? toDate(active.endDate).getTime() : Date.now();
    const length = endMs - startMs;
    const beforeStart = startMs - length;
    let before = 0, during = 0;
    symptoms.forEach((s) => {
      const t = toDate(s.timestamp).getTime();
      if (t >= startMs && t <= endMs) during++;
      else if (t >= beforeStart && t < startMs) before++;
    });
    return { before, during };
  }, [active, symptoms]);

  const startNew = () => {
    if (!newName.trim()) return;
    addExperiment({
      name: newName.trim(),
      startDate: new Date(),
      active: true,
      notes: newNotes.trim() || undefined,
      logs: [],
    });
    setShowNew(false);
    setNewName('');
    setNewTotal(30);
    setNewNotes('');
  };

  const submitLog = () => {
    if (!logFor) return;
    if (logType === 'text' && !logContent.trim()) return;
    if (logType === 'image' && !logContent) return;
    addExperimentLog(logFor, {
      type: logType,
      content: logContent,
      notes: logNotes.trim() || undefined,
    });
    setLogFor(null); setLogContent(''); setLogNotes(''); setLogType('text');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('experiments.eyebrow')}
        title={t('experiments.title')}
        subtitle={t('experiments.subtitle')}
        action={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconPlus size={13} /> {t('experiments.new')}
          </button>
        }
      />

      {active && compare && (
        <div
          className="mx-5 mb-5 overflow-hidden rounded-card"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
        >
          <div className="p-4">
            <div className="flex items-baseline gap-2.5">
              <span className="eyebrow text-accent">{t('experiments.active')}</span>
              <span className="font-mono text-[10.5px] muted">{fmtDate(active.startDate)}</span>
            </div>
            <div className="font-heading text-[28px] tracking-head ink mt-1">{active.name}</div>
            <div className="text-[13px] muted">{t('experiments.day_n', { n: daysBetween(active.startDate) })}</div>

            <div className="mt-3.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, daysBetween(active.startDate) / 30 * 100)}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5 eyebrow text-[10px]">
                <span>D1</span><span>D30</span>
              </div>
            </div>

            <div
              className="grid grid-cols-2 mt-4 rounded-card overflow-hidden"
              style={{ background: 'var(--border)', gap: 1 }}
            >
              <div className="px-3.5 py-3 flex flex-col gap-0.5" style={{ background: 'var(--surface)' }}>
                <div className="eyebrow">{t('experiments.prior_window')}</div>
                <div className="font-heading text-[24px] tracking-head ink">{compare.before}</div>
                <div className="text-[11px] muted">{t('experiments.symptoms')}</div>
              </div>
              <div className="px-3.5 py-3 flex flex-col gap-0.5" style={{ background: 'var(--surface)' }}>
                <div className="eyebrow">{t('experiments.during')}</div>
                <div className="font-heading text-[24px] tracking-head text-accent">{compare.during}</div>
                <div className="text-[11px] muted">{t('experiments.symptoms')}</div>
              </div>
            </div>
          </div>

          {compare.before > 0 && (
            <AIAnnotation label={t('experiments.reading')}>
              Symptom count is {compare.during < compare.before ? 'down' : 'up'} {Math.round(Math.abs(1 - compare.during / Math.max(1, compare.before)) * 100)}% versus the equal-length window before this experiment started. Association only — not proven cause.
            </AIAnnotation>
          )}

          {active.fodmap && <FodmapPanel experimentId={active.id} state={active.fodmap} />}

          {!active.fodmap && /low[-\s]?fodmap/i.test(active.name) && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => {
                  updateExperiment(active.id, {
                    fodmap: { phase: 'elimination', passed: [], reactive: [] },
                  });
                }}
                className="px-3 py-1.5 rounded-full text-[12px]"
                style={{ background: 'var(--accent)', color: 'var(--surface)' }}
              >
                Enable structured FODMAP mode
              </button>
              <p className="text-[11.5px] muted mt-1.5">
                Three phases: elimination → reintroduction (group by group) → personalization.
              </p>
            </div>
          )}

          <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setLogFor(active.id)}
              className="flex-1 py-3 text-[13px] ink-soft"
              style={{ borderRight: '1px solid var(--border)' }}
            >
              {t('experiments.add_note')}
            </button>
            <button
              onClick={() => setExpanded(expanded === active.id ? null : active.id)}
              className="flex-1 py-3 text-[13px] ink-soft"
              style={{ borderRight: '1px solid var(--border)' }}
            >
              {expanded === active.id ? t('experiments.hide_logs') : t('experiments.logs_n', { n: active.logs?.length ?? 0 })}
            </button>
            <button onClick={() => endExperiment(active.id)} className="flex-1 py-3 text-[13px] ink-soft">
              {t('experiments.end_early')}
            </button>
          </div>

          {expanded === active.id && (
            <div className="px-4 pb-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
              {(active.logs || []).length === 0 ? (
                <p className="muted text-[12.5px]">No logs yet.</p>
              ) : (
                (active.logs || []).map((log) => (
                  <div key={log.id} className="card p-3 text-[13px] ink-soft">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="eyebrow">{log.type}</span>
                      <span className="font-mono text-[11px] muted">{toDate(log.timestamp).toLocaleString()}</span>
                      <button
                        onClick={() => deleteExperimentLog(active.id, log.id)}
                        className="ml-auto muted hover:text-ink"
                        aria-label="Delete log"
                      >
                        ×
                      </button>
                    </div>
                    {log.type === 'text' && <p className="m-0">{log.content}</p>}
                    {log.type === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={log.content} alt="" className="rounded-card max-h-40 object-cover mt-1" />
                    )}
                    {log.notes && <p className="mt-1 italic text-[12px] muted">{log.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!active && (
        <div className="mx-5 mb-5 card p-4">
          <p className="text-[13px] ink-soft mb-2">
            {t('experiments.no_active')}
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {t('experiments.start')}
          </button>
        </div>
      )}

      {past.length > 0 && (
        <section className="px-5 pb-10">
          <h3 className="m-0 mb-2.5 font-heading text-[16px] tracking-head ink">{t('experiments.past')}</h3>
          {past.map((e) => {
            const days = daysBetween(e.startDate, e.endDate);
            const startMs = toDate(e.startDate).getTime();
            const endMs = e.endDate ? toDate(e.endDate).getTime() : Date.now();
            const length = endMs - startMs;
            const before = symptoms.filter((s) => {
              const t = toDate(s.timestamp).getTime();
              return t >= startMs - length && t < startMs;
            }).length;
            const during = symptoms.filter((s) => {
              const t = toDate(s.timestamp).getTime();
              return t >= startMs && t <= endMs;
            }).length;
            const delta = before > 0 ? Math.round((1 - during / before) * 100) : 0;
            return (
              <div key={e.id} className="card p-3.5 mb-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-medium ink truncate">{e.name}</div>
                  <div className="text-[11.5px] muted font-mono mt-0.5">
                    {days} days · ended {e.endDate ? fmtDate(e.endDate) : '—'}
                  </div>
                </div>
                {before > 0 && (
                  <div className="text-right">
                    <div className="font-mono text-[12px] text-accent">{delta > 0 ? '−' : '+'}{Math.abs(delta)}%</div>
                    <div className="eyebrow">{t('experiments.symptoms')}</div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {showNew && (
        <Modal onClose={() => setShowNew(false)} title={t('experiments.modal_start')}>
          <label className="block">
            <span className="eyebrow">{t('experiments.name')}</span>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. No Dairy 30 days"
              className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
              style={{ border: '1px solid var(--border)' }}
            />
          </label>
          <label className="block mt-3">
            <span className="eyebrow">{t('experiments.length_days')}</span>
            <input
              type="number"
              min={3}
              max={120}
              value={newTotal}
              onChange={(e) => setNewTotal(Number(e.target.value))}
              className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
              style={{ border: '1px solid var(--border)' }}
            />
          </label>
          <label className="block mt-3">
            <span className="eyebrow">{t('common.notes')} ({t('common.optional')})</span>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Why are you testing this?"
              className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
              style={{ border: '1px solid var(--border)' }}
            />
          </label>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowNew(false)}
              className="flex-1 px-3 py-2 rounded-full text-[13px]"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={startNew}
              disabled={!newName.trim()}
              className="flex-1 px-3 py-2 rounded-full text-[13px] disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {t('experiments.start')}
            </button>
          </div>
        </Modal>
      )}

      {logFor && (
        <Modal onClose={() => setLogFor(null)} title={t('experiments.modal_log')}>
          <div className="flex gap-1.5 mb-3">
            {(['text', 'image'] as ExperimentLogType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setLogType(t); setLogContent(''); }}
                className="px-3 py-1 rounded-full text-[12px] capitalize"
                style={{
                  background: logType === t ? 'var(--ink)' : 'transparent',
                  color: logType === t ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${logType === t ? 'var(--ink)' : 'var(--border)'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {logType === 'text' ? (
            <textarea
              autoFocus
              rows={4}
              value={logContent}
              onChange={(e) => setLogContent(e.target.value)}
              placeholder="What happened today?"
              className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
              style={{ border: '1px solid var(--border)' }}
            />
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setLogContent(r.result as string);
                  r.readAsDataURL(f);
                }}
              />
              {!logContent ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-card text-[13px] ink-soft"
                  style={{ border: '2px dashed var(--border-strong)' }}
                >
                  📷 Upload image
                </button>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logContent} alt="" className="w-full rounded-card max-h-48 object-cover" />
              )}
            </div>
          )}
          <textarea
            rows={2}
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            placeholder={`${t('common.notes')} (${t('common.optional')})`}
            className="mt-3 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
            style={{ border: '1px solid var(--border)' }}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setLogFor(null)}
              className="flex-1 px-3 py-2 rounded-full text-[13px]"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={submitLog}
              className="flex-1 px-3 py-2 rounded-full text-[13px]"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {t('common.save')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const FODMAP_GROUPS: Array<{ id: string; label: string; examples: string }> = [
  { id: 'fructans',       label: 'Fructans',          examples: 'wheat, onion, garlic, leek' },
  { id: 'gos',            label: 'GOS',               examples: 'legumes, cashews, pistachios' },
  { id: 'lactose',        label: 'Lactose',           examples: 'milk, soft cheese, yogurt' },
  { id: 'fructose',       label: 'Excess fructose',   examples: 'apple, mango, honey, agave' },
  { id: 'polyols-sorbitol', label: 'Sorbitol',        examples: 'stone fruit, sugar-free gum' },
  { id: 'polyols-mannitol', label: 'Mannitol',        examples: 'mushroom, cauliflower' },
];

function FodmapPanel({ experimentId, state }: { experimentId: string; state: FodmapState }) {
  const updateExperiment = useAppStore((s) => s.updateExperiment);

  const update = (next: Partial<FodmapState>) =>
    updateExperiment(experimentId, { fodmap: { ...state, ...next } });

  const goToPhase = (phase: FodmapPhase) => update({ phase, currentChallenge: undefined, challengeStartedAt: undefined });

  const startChallenge = (groupId: string) =>
    update({ currentChallenge: groupId, challengeStartedAt: new Date() });

  const finishChallenge = (outcome: 'passed' | 'reactive') => {
    if (!state.currentChallenge) return;
    const passed = new Set(state.passed || []);
    const reactive = new Set(state.reactive || []);
    if (outcome === 'passed') {
      passed.add(state.currentChallenge);
      reactive.delete(state.currentChallenge);
    } else {
      reactive.add(state.currentChallenge);
      passed.delete(state.currentChallenge);
    }
    update({ passed: Array.from(passed), reactive: Array.from(reactive), currentChallenge: undefined, challengeStartedAt: undefined });
  };

  return (
    <div className="px-4 py-3.5" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="eyebrow">FODMAP mode</div>
        <div className="flex gap-1">
          {(['elimination', 'reintroduction', 'personalization'] as FodmapPhase[]).map((p) => {
            const on = state.phase === p;
            return (
              <button
                key={p}
                onClick={() => goToPhase(p)}
                className="px-2.5 py-1 rounded-full text-[11px] capitalize"
                style={{
                  background: on ? 'var(--ink)' : 'transparent',
                  color: on ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {state.phase === 'elimination' && (
        <p className="text-[12.5px] ink-soft m-0">
          Stay strictly low-FODMAP for 2–6 weeks. When you have a clear stretch of low symptom days, move on to Reintroduction.
        </p>
      )}

      {state.phase === 'reintroduction' && (
        <div>
          {state.currentChallenge ? (
            <div className="card p-3 mb-2">
              <div className="text-[13.5px] ink font-medium">
                Challenging {FODMAP_GROUPS.find((g) => g.id === state.currentChallenge)?.label}
              </div>
              <div className="text-[11.5px] muted mt-0.5">
                Eat a measured portion daily for 3 days. Log symptoms each day. After the 3-day challenge, decide.
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => finishChallenge('passed')}
                  className="px-3 py-1 rounded-full text-[12px]"
                  style={{ background: 'var(--accent)', color: 'var(--surface)' }}
                >
                  Tolerated
                </button>
                <button
                  onClick={() => finishChallenge('reactive')}
                  className="px-3 py-1 rounded-full text-[12px]"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
                >
                  Triggered symptoms
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[12.5px] ink-soft m-0 mb-2">Pick a group to challenge next:</p>
              <div className="flex flex-wrap gap-1.5">
                {FODMAP_GROUPS.map((g) => {
                  const done = (state.passed || []).includes(g.id) || (state.reactive || []).includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => startChallenge(g.id)}
                      disabled={done}
                      title={g.examples}
                      className="px-2.5 py-1.5 rounded-full text-[11.5px]"
                      style={{
                        border: `1px solid ${done ? 'var(--border)' : 'var(--border-strong)'}`,
                        color: done ? 'var(--muted)' : 'var(--ink-soft)',
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      {g.label}{done ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {state.phase === 'personalization' && (
        <p className="text-[12.5px] ink-soft m-0">
          Build your personal diet from what you tolerated. Re-test reactive groups occasionally — tolerance can shift.
        </p>
      )}

      {((state.passed && state.passed.length > 0) || (state.reactive && state.reactive.length > 0)) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="eyebrow mb-1">Tolerated</div>
            <div className="flex flex-wrap gap-1">
              {(state.passed || []).length === 0 && <span className="text-[12px] muted">—</span>}
              {(state.passed || []).map((id) => (
                <span key={id} className="pill text-[11px]" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  {FODMAP_GROUPS.find((g) => g.id === id)?.label ?? id}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-1">Reactive</div>
            <div className="flex flex-wrap gap-1">
              {(state.reactive || []).length === 0 && <span className="text-[12px] muted">—</span>}
              {(state.reactive || []).map((id) => (
                <span key={id} className="pill text-[11px]" style={{ borderColor: '#c44', color: '#c44' }}>
                  {FODMAP_GROUPS.find((g) => g.id === id)?.label ?? id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md max-h-[88vh] overflow-y-auto p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0 font-heading text-[22px] tracking-head ink">{title}</h2>
          <button onClick={onClose} className="muted hover:text-ink" aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
