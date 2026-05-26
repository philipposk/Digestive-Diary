'use client';

import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { FoodLog, Symptom } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import TimelineRow, { TimelineItem } from '@/components/ui/TimelineRow';
import Sparkline from '@/components/ui/Sparkline';
import { IconDownRight, IconUpRight } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

type SortOrder = 'newest' | 'oldest';

interface SummaryResult {
  summary: string;
  highlights: string[];
}

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

export default function TimelinePage() {
  const { t } = useT();
  const [filter, setFilter] = useState<'all' | 'food' | 'symptom' | 'context'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summaryCacheRef = useRef<Map<string, SummaryResult>>(new Map());

  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const contexts = useAppStore((s) => s.contexts);
  const experiments = useAppStore((s) => s.experiments);
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);

  const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
  const startMs = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [days]);

  const filteredItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    if (filter === 'all' || filter === 'food') {
      foodLogs.forEach((log) => {
        const t = toDate(log.timestamp);
        if (t.getTime() >= startMs) {
          items.push({
            id: log.id,
            kind: 'food',
            timestamp: t,
            title: log.food,
            detail: log.quantity,
            tags: log.tags,
          });
        }
      });
    }
    if (filter === 'all' || filter === 'symptom') {
      symptoms.forEach((sym) => {
        const t = toDate(sym.timestamp);
        if (t.getTime() >= startMs) {
          const linked = sym.linkedFoodId ? foodLogs.find((f) => f.id === sym.linkedFoodId) : null;
          items.push({
            id: sym.id,
            kind: 'symptom',
            timestamp: t,
            title: sym.type,
            duration: sym.duration,
            severity: sym.severity,
            note: sym.notes,
            photoUrl: sym.photoUrl,
            linkedFoodTitle: linked?.food,
          });
        }
      });
    }
    if (filter === 'all' || filter === 'context') {
      contexts.forEach((ctx) => {
        const t = toDate(ctx.timestamp);
        if (t.getTime() >= startMs) {
          const bits = [
            ctx.sleepQuality && `sleep ${ctx.sleepQuality}`,
            ctx.stressLevel && `stress ${ctx.stressLevel}`,
            ctx.activityLevel && ctx.activityLevel !== 'none' && `activity ${ctx.activityLevel}`,
            ctx.bristolType && `bristol type ${ctx.bristolType}`,
            ctx.cyclePhase && `cycle ${ctx.cyclePhase}`,
            ctx.hydrationMl && `${ctx.hydrationMl}ml water`,
          ].filter(Boolean) as string[];
          items.push({
            id: ctx.id,
            kind: 'context',
            timestamp: t,
            title: bits.length ? bits.join(' · ') : 'Context',
            detail: ctx.notes,
          });
        }
      });
      medicationLogs.forEach((log) => {
        const t = toDate(log.timestamp);
        if (t.getTime() >= startMs) {
          const med = medications.find((m) => m.id === log.medicationId);
          items.push({
            id: log.id,
            kind: 'context',
            timestamp: t,
            title: `💊 ${med?.name ?? 'Medication'}`,
            detail: med?.dose,
            note: log.notes,
          });
        }
      });
      customFactorLogs.forEach((log) => {
        const t = toDate(log.timestamp);
        if (t.getTime() >= startMs) {
          const f = customFactors.find((cf) => cf.id === log.factorId);
          if (!f) return;
          const display = f.scale === 'yesno' ? (log.value ? 'yes' : 'no') : `${log.value}${f.unit ? ` ${f.unit}` : ''}`;
          items.push({
            id: log.id,
            kind: 'context',
            timestamp: t,
            title: `${f.label}: ${display}`,
            note: log.notes,
          });
        }
      });
    }
    items.sort((a, b) => sortOrder === 'newest' ? b.timestamp.getTime() - a.timestamp.getTime() : a.timestamp.getTime() - b.timestamp.getTime());
    return items;
  }, [foodLogs, symptoms, contexts, medicationLogs, medications, customFactorLogs, customFactors, filter, startMs, sortOrder]);

  // Build per-day buckets for "Today / Yesterday / DD MMM" sections.
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: TimelineItem[] }>();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    filteredItems.forEach((it) => {
      const d = new Date(it.timestamp); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
      const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const entry = map.get(key) ?? { label, items: [] };
      entry.items.push(it);
      map.set(key, entry);
    });
    return Array.from(map.values());
  }, [filteredItems]);

  // 14-day severity sparkline (always built from full symptom set, ignoring date filter)
  const spark14 = useMemo(() => {
    const buckets: number[] = Array.from({ length: 14 }, () => 0);
    const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
    symptoms.forEach((s) => {
      const t = toDate(s.timestamp); t.setHours(0, 0, 0, 0);
      const diff = Math.round((todayMid.getTime() - t.getTime()) / 86_400_000);
      if (diff >= 0 && diff < 14) buckets[13 - diff] += s.severity;
    });
    return buckets;
  }, [symptoms]);

  const avgPerDay = useMemo(() => {
    const total = spark14.reduce((a, b) => a + b, 0);
    return spark14.length > 0 ? total / spark14.length : 0;
  }, [spark14]);
  const prev = useMemo(() => spark14.slice(0, 7).reduce((a, b) => a + b, 0), [spark14]);
  const last = useMemo(() => spark14.slice(7).reduce((a, b) => a + b, 0), [spark14]);
  const deltaPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;

  const handleSummarize = async () => {
    const inRangeFoods = foodLogs.filter((f) => toDate(f.timestamp).getTime() >= startMs);
    const inRangeSymptoms = symptoms.filter((s) => toDate(s.timestamp).getTime() >= startMs);
    const cacheKey = `${dateRange}|${inRangeFoods.length}|${inRangeSymptoms.length}|${inRangeFoods[0]?.id ?? ''}|${inRangeSymptoms[0]?.id ?? ''}`;
    const cached = summaryCacheRef.current.get(cacheKey);
    if (cached) { setSummary(cached); setSummaryError(null); return; }
    setSummaryLoading(true); setSummaryError(null);
    try {
      const res = await fetch('/api/openai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineData: {
            rangeDays: days,
            foodLogs: inRangeFoods.map((f) => ({ food: f.food, tags: f.tags, timestamp: toDate(f.timestamp).toISOString() })),
            symptoms: inRangeSymptoms.map((s) => ({ type: s.type, severity: s.severity, timestamp: toDate(s.timestamp).toISOString() })),
            experiments: experiments.map((e) => ({ name: e.name, active: e.active })),
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Summary failed: ${res.status}`);
      }
      const data = (await res.json()) as SummaryResult;
      const result: SummaryResult = {
        summary: typeof data?.summary === 'string' ? data.summary : '',
        highlights: Array.isArray(data?.highlights) ? data.highlights : [],
      };
      summaryCacheRef.current.set(cacheKey, result);
      setSummary(result);
    } catch (err: any) {
      setSummaryError(err?.message || 'Failed to summarize');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('timeline.last_days', { n: days })}
        title={t('timeline.title')}
      />

      <div className="mx-5 mb-4 flex gap-1.5 flex-wrap">
        {(['all', 'food', 'symptom', 'context'] as const).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs capitalize transition-colors"
              style={{
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--ink-soft)',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--border)'}`,
                fontWeight: 500,
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="mx-5 mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="eyebrow mb-1">{t('timeline.range')}</div>
          <div className="flex gap-1.5">
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className="px-2.5 py-1 rounded-full text-[11.5px]"
                style={{
                  background: dateRange === r ? 'var(--ink)' : 'transparent',
                  color: dateRange === r ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${dateRange === r ? 'var(--ink)' : 'var(--border)'}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow mb-1">{t('timeline.sort')}</div>
          <div className="flex gap-1.5">
            {(['newest', 'oldest'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setSortOrder(o)}
                className="px-2.5 py-1 rounded-full text-[11.5px] capitalize"
                style={{
                  background: sortOrder === o ? 'var(--ink)' : 'transparent',
                  color: sortOrder === o ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${sortOrder === o ? 'var(--ink)' : 'var(--border)'}`,
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-5 mb-5 card p-3.5 flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">{t('timeline.sev_label')}</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-heading text-[26px] font-semibold tracking-head ink">{avgPerDay.toFixed(1)}</span>
            <span className="text-xs muted">{t('timeline.avg_day')}</span>
            {deltaPct !== 0 && (
              <span className="ml-1.5 text-[11.5px] inline-flex items-center gap-1 text-accent">
                {deltaPct < 0 ? <IconDownRight size={11} /> : <IconUpRight size={11} />}
                {Math.abs(deltaPct)}%
              </span>
            )}
          </div>
        </div>
        <Sparkline data={spark14.length === 14 ? spark14 : [0]} width={140} height={36} />
      </div>

      <div className="mx-5 mb-5 card p-3.5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="eyebrow">{t('timeline.summary_label', { n: days })}</div>
            <p className="text-[11.5px] muted mt-0.5">{t('timeline.summary_body')}</p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={summaryLoading}
            className="px-3 py-1.5 text-xs rounded-full disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {summaryLoading ? t('timeline.summarizing') : summary ? t('common.refresh') : t('timeline.summarize')}
          </button>
        </div>
        {summaryError && <p className="text-[12px]" style={{ color: '#c44' }}>{summaryError}</p>}
        {summary && (
          <div className="space-y-2 mt-2">
            {summary.summary && <p className="text-[13.5px] ink-soft whitespace-pre-line">{summary.summary}</p>}
            {summary.highlights.length > 0 && (
              <ul className="list-disc list-inside text-[13px] ink-soft space-y-1">
                {summary.highlights.map((h, i) => (<li key={i}>{h}</li>))}
              </ul>
            )}
          </div>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="mx-5 mb-10 card p-4 muted text-[13px]">{t('timeline.no_entries')}</div>
      ) : (
        grouped.map((g) => (
          <section key={g.label} className="px-5 pb-4">
            <div className="flex items-baseline gap-2.5 mt-1 mb-1">
              <h2 className="m-0 font-heading text-[22px] tracking-head ink">{
                g.label === 'Today' ? t('timeline.today') :
                g.label === 'Yesterday' ? t('timeline.yesterday') :
                g.label
              }</h2>
              <span className="eyebrow">{t('timeline.entries', { n: g.items.length })}</span>
            </div>
            {g.items.map((it, i, arr) => (
              <TimelineRow key={it.id} item={it} prev={i > 0} next={i < arr.length - 1} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
