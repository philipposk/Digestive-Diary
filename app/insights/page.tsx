'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/generateInsights';
import { Pattern } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Confidence from '@/components/ui/Confidence';
import AIAnnotation from '@/components/ui/AIAnnotation';
import { IconChevR, IconSpark } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food',
  tag: 'Tag',
  psychological: 'Psychological',
  experiment: 'Experiment',
  trend: 'Trend',
  bayes: 'Probability',
  medication: 'Medication',
  factor: 'Factor',
};

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

export default function InsightsPage() {
  const { t } = useT();
  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const experiments = useAppStore((s) => s.experiments);
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [open, setOpen] = useState<Pattern | null>(null);

  const insights = useMemo(
    () => generateInsights(foodLogs, symptoms, experiments, medications, medicationLogs, customFactors, customFactorLogs),
    [foodLogs, symptoms, experiments, medications, medicationLogs, customFactors, customFactorLogs]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    insights.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [insights]);

  const filtered = useMemo(
    () => selectedCategory === 'all' ? insights : insights.filter((p) => p.category === selectedCategory),
    [insights, selectedCategory]
  );

  const weeklyNote = useMemo(() => {
    if (foodLogs.length === 0 && symptoms.length === 0) return 'Not enough data yet. Log a few meals and symptoms to see patterns appear.';
    const since = Date.now() - 7 * 86_400_000;
    const meals = foodLogs.filter((l) => toDate(l.timestamp).getTime() >= since).length;
    const sym = symptoms.filter((s) => toDate(s.timestamp).getTime() >= since).length;
    const topPattern = insights[0];
    const exp = insights.find((p) => p.category === 'experiment');
    const lead = `This week you logged ${meals} meals and ${sym} symptoms.`;
    const sig = topPattern ? ` Strongest signal: ${topPattern.description}` : '';
    const expLine = exp ? ` ${exp.description}` : '';
    return lead + sig + expLine;
  }, [foodLogs, symptoms, insights]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('insights.this_week')}
        title={t('insights.title')}
        subtitle={t('insights.subtitle')}
      />

      <div className="mx-5 mb-5 p-4 rounded-card" style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-[18px] h-[18px] rounded-md flex items-center justify-center"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconSpark size={11} stroke={2} />
          </div>
          <div className="eyebrow">{t('insights.weekly_note')}</div>
        </div>
        <p className="m-0 text-[14px] leading-snug ink-soft">{weeklyNote}</p>
      </div>

      {categories.length > 0 && (
        <div className="mx-5 mb-3 flex flex-wrap gap-1.5">
          {(['all', ...categories]).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className="px-3 py-1 rounded-full text-xs capitalize"
              style={{
                background: selectedCategory === c ? 'var(--ink)' : 'transparent',
                color: selectedCategory === c ? 'var(--bg)' : 'var(--ink-soft)',
                border: `1px solid ${selectedCategory === c ? 'var(--ink)' : 'var(--border)'}`,
              }}
            >
              {c === 'all' ? t('common.all') : CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      )}

      <section className="px-5 pb-10">
        <div className="flex items-baseline justify-between mb-2.5">
          <h2 className="m-0 font-heading text-[18px] font-semibold tracking-head ink">{t('insights.patterns')}</h2>
          <span className="eyebrow">{filtered.length} {t('common.found')}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-4 text-[13px] ink-soft">
            <p className="m-0">{t('insights.no_patterns')}</p>
          </div>
        ) : (
          filtered.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setOpen(p)}
              className="card w-full text-left p-3.5 mb-2.5 transition-colors hover:bg-surf-alt"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[11px] muted">0{idx + 1}</span>
                <Confidence level={p.confidence} />
                {p.category && (
                  <span className="ml-auto eyebrow">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                )}
              </div>
              <div
                className="font-heading text-[16px] leading-tight tracking-head ink mb-1 text-pretty"
                style={{ fontWeight: 600 }}
              >
                <span>{p.pattern.symptom}</span>{' '}
                <span className="muted font-normal">follows</span>{' '}
                {p.pattern.followsFood && <span className="text-accent">{p.pattern.followsFood}</span>}
              </div>
              <p className="m-0 text-[13px] ink-soft mb-2.5">{p.description}</p>
              <div className="flex items-center gap-3 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, p.dataPoints * 14)}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] muted">{p.dataPoints} pts</span>
                </div>
                {p.pattern.timeWindow && (
                  <span className="pill">{p.pattern.timeWindow}</span>
                )}
                <IconChevR size={14} className="muted" style={{ color: 'var(--muted)' }} />
              </div>
            </button>
          ))
        )}
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setOpen(null)}
        >
          <div
            className="card w-full max-w-md max-h-[88vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="eyebrow">{t('insights.detail_eyebrow')}</div>
                <h2 className="m-0 font-heading text-[24px] tracking-head ink">
                  {open.pattern.symptom}
                </h2>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="muted hover:text-ink"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>
            <p className="text-[13.5px] ink-soft">{open.description}</p>
            <div className="grid grid-cols-2 gap-3 my-4">
              <div>
                <div className="eyebrow mb-1">{t('insights.confidence')}</div>
                <Confidence level={open.confidence} />
              </div>
              <div>
                <div className="eyebrow mb-1">{t('insights.data_points')}</div>
                <div className="font-mono text-[13px] ink">{open.dataPoints}</div>
              </div>
              {open.pattern.followsFood && (
                <div>
                  <div className="eyebrow mb-1">{t('insights.follows')}</div>
                  <div className="text-[13px] ink">{open.pattern.followsFood}</div>
                </div>
              )}
              {open.pattern.timeWindow && (
                <div>
                  <div className="eyebrow mb-1">{t('insights.window')}</div>
                  <div className="text-[13px] ink">{open.pattern.timeWindow}</div>
                </div>
              )}
            </div>
            {open.psychologicalFlag && (
              <AIAnnotation label={t('insights.psych_label')}>
                {t('insights.psych_body')}
              </AIAnnotation>
            )}
            {open.occurrences && open.occurrences.length > 0 && (
              <div className="mt-4">
                <div className="eyebrow mb-1.5">{t('insights.occurrences')} ({open.occurrences.length})</div>
                <ul className="space-y-1 text-[12.5px] ink-soft">
                  {open.occurrences.slice(0, 8).map((o, i) => (
                    <li key={i} className="flex justify-between">
                      <span>#{i + 1}</span>
                      <span className="font-mono">~{o.hoursBetween}h after</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 text-[11.5px] muted">
              {t('insights.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
