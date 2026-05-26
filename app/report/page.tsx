'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/generateInsights';
import { useT } from '@/lib/i18n';
import { BRISTOL_LABEL } from '@/components/ui/BristolPicker';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function ReportContent() {
  const { t } = useT();
  const params = useSearchParams();
  const rangeParam = (params.get('range') || '30d') as '7d' | '14d' | '30d' | '60d' | '90d';
  const [range, setRange] = useState<typeof rangeParam>(rangeParam);
  const [patientName, setPatientName] = useState('');
  const [clinicianNotes, setClinicianNotes] = useState('');

  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const contexts = useAppStore((s) => s.contexts);
  const experiments = useAppStore((s) => s.experiments);
  const realizations = useAppStore((s) => s.realizations);
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);

  const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : range === '60d' ? 60 : 90;
  const startMs = useMemo(() => Date.now() - days * 86_400_000, [days]);

  const rangeFoods = useMemo(
    () => foodLogs.filter((f) => toDate(f.timestamp).getTime() >= startMs),
    [foodLogs, startMs]
  );
  const rangeSymptoms = useMemo(
    () => symptoms.filter((s) => toDate(s.timestamp).getTime() >= startMs),
    [symptoms, startMs]
  );
  const rangeContexts = useMemo(
    () => contexts.filter((c) => toDate(c.timestamp).getTime() >= startMs),
    [contexts, startMs]
  );

  const rangeMedLogs = useMemo(
    () => medicationLogs.filter((l) => toDate(l.timestamp).getTime() >= startMs),
    [medicationLogs, startMs]
  );
  const rangeFactorLogs = useMemo(
    () => customFactorLogs.filter((l) => toDate(l.timestamp).getTime() >= startMs),
    [customFactorLogs, startMs]
  );

  const insights = useMemo(
    () => generateInsights(rangeFoods, rangeSymptoms, experiments, medications, rangeMedLogs, customFactors, rangeFactorLogs),
    [rangeFoods, rangeSymptoms, experiments, medications, rangeMedLogs, customFactors, rangeFactorLogs]
  );

  // Severity timeline per day (max severity per day so a single big episode shows).
  const severityByDay = useMemo(() => {
    const buckets = new Map<string, number>();
    rangeSymptoms.forEach((s) => {
      const d = toDate(s.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const cur = buckets.get(key) ?? 0;
      buckets.set(key, Math.max(cur, s.severity));
    });
    const out: Array<{ date: string; severity: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ date: key, severity: buckets.get(key) ?? 0 });
    }
    return out;
  }, [rangeSymptoms, days]);

  // Bristol distribution.
  const bristolCounts = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    rangeContexts.forEach((c) => {
      if (c.bristolType) m[c.bristolType] = (m[c.bristolType] ?? 0) + 1;
    });
    return m;
  }, [rangeContexts]);
  const bristolTotal = Object.values(bristolCounts).reduce((a, b) => a + b, 0);

  // Symptom-type breakdown.
  const symptomTypes = useMemo(() => {
    const m = new Map<string, { count: number; avgSev: number }>();
    rangeSymptoms.forEach((s) => {
      const cur = m.get(s.type) ?? { count: 0, avgSev: 0 };
      cur.avgSev = (cur.avgSev * cur.count + s.severity) / (cur.count + 1);
      cur.count += 1;
      m.set(s.type, cur);
    });
    return Array.from(m.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [rangeSymptoms]);

  // Per-day table (latest 14 days even if range bigger).
  const tableDays = useMemo(() => {
    const showDays = Math.min(days, 14);
    const arr: Array<{ date: Date; foods: typeof foodLogs; sympts: typeof symptoms }> = [];
    for (let i = 0; i < showDays; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86_400_000;
      arr.push({
        date: d,
        foods: foodLogs.filter((f) => {
          const t = toDate(f.timestamp).getTime();
          return t >= dayStart && t < dayEnd;
        }),
        sympts: symptoms.filter((s) => {
          const t = toDate(s.timestamp).getTime();
          return t >= dayStart && t < dayEnd;
        }),
      });
    }
    return arr;
  }, [foodLogs, symptoms, days]);

  return (
    <div className="report-root max-w-4xl mx-auto px-6 pt-6 pb-12 print:p-0 print:max-w-none">
      <div className="screen-controls flex flex-wrap items-center gap-3 mb-5 print:hidden">
        <div>
          <label className="block text-xs muted mb-1">Patient name (optional)</label>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="—"
            className="px-3 py-1.5 rounded-card text-[13px] bg-app outline-none ink"
            style={{ border: '1px solid var(--border)' }}
          />
        </div>
        <div>
          <label className="block text-xs muted mb-1">Range</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="px-3 py-1.5 rounded-card text-[13px] bg-app outline-none ink"
            style={{ border: '1px solid var(--border)' }}
          >
            {(['7d', '14d', '30d', '60d', '90d'] as const).map((r) => (
              <option key={r} value={r}>Last {r}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs muted mb-1">Notes for clinician</label>
          <input
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Short context for your doctor"
            className="w-full px-3 py-1.5 rounded-card text-[13px] bg-app outline-none ink"
            style={{ border: '1px solid var(--border)' }}
          />
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-full text-[13px]"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Save as PDF / Print
        </button>
        <a
          href="/settings"
          className="text-[12px] text-accent"
        >
          Back to settings
        </a>
      </div>

      <header className="report-header pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-strong)' }}>
        <div className="eyebrow">Digestive Diary · Clinician report</div>
        <h1 className="m-0 mt-1 font-heading text-[28px] tracking-head ink">
          {patientName.trim() || 'Patient report'}
        </h1>
        <div className="mt-1 text-[12.5px] muted">
          Range: {fmtDate(new Date(startMs))} → {fmtDate(new Date())} · Generated {fmtDate(new Date())} {fmtTime(new Date())}
        </div>
        <div className="mt-1 text-[11px] muted italic">
          Self-reported data. Not a diagnostic tool.
        </div>
      </header>

      <section className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Meals" value={rangeFoods.length} />
        <Stat label="Symptoms" value={rangeSymptoms.length} />
        <Stat label="Context logs" value={rangeContexts.length} />
        <Stat label="Avg severity" value={
          rangeSymptoms.length === 0 ? '—' :
          (rangeSymptoms.reduce((a, s) => a + s.severity, 0) / rangeSymptoms.length).toFixed(1)
        } />
      </section>

      {clinicianNotes.trim() && (
        <section className="card p-4 mb-5">
          <div className="eyebrow mb-1">Notes for clinician</div>
          <p className="m-0 text-[13.5px] ink-soft whitespace-pre-line">{clinicianNotes}</p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-heading text-[18px] tracking-head ink m-0 mb-2">Symptom severity timeline ({days}d)</h2>
        <div
          className="card p-4 flex items-end gap-[2px]"
          style={{ height: 120, overflowX: 'auto' }}
        >
          {severityByDay.map((d, i) => {
            const h = (d.severity / 10) * 100;
            return (
              <div key={i} className="flex flex-col items-center" style={{ minWidth: 5 }}>
                <div
                  style={{
                    height: `${h}%`,
                    minHeight: d.severity > 0 ? 2 : 0,
                    width: 4,
                    background: d.severity >= 7 ? '#c44' : d.severity >= 4 ? 'var(--accent)' : 'var(--accent-soft)',
                    borderRadius: 1,
                  }}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] muted mt-1">
          Bars = max symptom severity that day. Red ≥7. Empty = no symptom logged.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Bristol distribution</h2>
          {bristolTotal === 0 ? (
            <p className="text-[12.5px] muted">No bowel logs in range.</p>
          ) : (
            <table className="w-full text-[12px]">
              <tbody>
                {([1, 2, 3, 4, 5, 6, 7] as const).map((b) => {
                  const c = bristolCounts[b];
                  const pct = bristolTotal > 0 ? Math.round((c / bristolTotal) * 100) : 0;
                  return (
                    <tr key={b}>
                      <td className="py-0.5 pr-2 ink-soft" style={{ width: 60 }}>Type {b}</td>
                      <td className="pr-2 muted" style={{ width: 110 }}>{BRISTOL_LABEL[b]}</td>
                      <td className="pr-2">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                        </div>
                      </td>
                      <td className="font-mono text-[11px] muted" style={{ width: 38 }}>{c}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Symptom types</h2>
          {symptomTypes.length === 0 ? (
            <p className="text-[12.5px] muted">No symptoms in range.</p>
          ) : (
            <table className="w-full text-[12px]">
              <tbody>
                {symptomTypes.map(([type, d]) => (
                  <tr key={type}>
                    <td className="py-0.5 pr-2 ink truncate" style={{ maxWidth: 140 }}>{type}</td>
                    <td className="font-mono text-[11px] muted pr-2" style={{ width: 50 }}>{d.count}×</td>
                    <td className="font-mono text-[11px] text-accent" style={{ width: 70 }}>avg {d.avgSev.toFixed(1)}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Top patterns (algorithmic)</h2>
        {insights.length === 0 ? (
          <p className="text-[12.5px] muted">Not enough data to surface patterns yet.</p>
        ) : (
          <ol className="list-decimal list-inside text-[12.5px] ink-soft space-y-1">
            {insights.slice(0, 8).map((p) => (
              <li key={p.id}>
                <span className="ink font-medium">{p.pattern.symptom}</span>
                {p.pattern.followsFood && <> · follows <span className="text-accent">{p.pattern.followsFood}</span></>}
                {p.pattern.timeWindow && <> · {p.pattern.timeWindow}</>}
                {' '}<span className="muted">({p.confidence}, {p.dataPoints} pts)</span>
                <div className="text-[11.5px] muted ml-4">{p.description}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Medications</h2>
        {medications.length === 0 ? (
          <p className="text-[12.5px] muted">No medications on file.</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="eyebrow text-left">
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2" style={{ width: 100 }}>Dose</th>
                <th className="py-1 pr-2" style={{ width: 80 }}>Status</th>
                <th className="py-1 pr-2" style={{ width: 60 }}>Doses</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => {
                const taken = rangeMedLogs.filter((l) => l.medicationId === m.id).length;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1 pr-2 ink">{m.name}</td>
                    <td className="py-1 pr-2 muted">{m.dose || '—'}</td>
                    <td className="py-1 pr-2 muted">{m.active ? 'active' : 'inactive'}</td>
                    <td className="py-1 pr-2 font-mono text-[11px]">{taken}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {customFactors.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Custom factors</h2>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="eyebrow text-left">
                <th className="py-1 pr-2">Label</th>
                <th className="py-1 pr-2" style={{ width: 100 }}>Scale</th>
                <th className="py-1 pr-2" style={{ width: 80 }}>Logs</th>
                <th className="py-1 pr-2" style={{ width: 110 }}>Avg / mode</th>
              </tr>
            </thead>
            <tbody>
              {customFactors.map((f) => {
                const logs = rangeFactorLogs.filter((l) => l.factorId === f.id);
                let stat = '—';
                if (logs.length > 0) {
                  if (f.scale === 'yesno') {
                    const yes = logs.filter((l) => l.value === 1).length;
                    stat = `${Math.round(yes / logs.length * 100)}% yes`;
                  } else {
                    const avg = logs.reduce((a, l) => a + l.value, 0) / logs.length;
                    stat = `avg ${avg.toFixed(1)}${f.unit ? ` ${f.unit}` : ''}`;
                  }
                }
                return (
                  <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1 pr-2 ink">{f.label}</td>
                    <td className="py-1 pr-2 muted">{f.scale}</td>
                    <td className="py-1 pr-2 font-mono text-[11px]">{logs.length}</td>
                    <td className="py-1 pr-2 ink-soft">{stat}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Experiments</h2>
        {experiments.length === 0 ? (
          <p className="text-[12.5px] muted">No experiments in range.</p>
        ) : (
          <ul className="text-[12.5px] ink-soft space-y-1">
            {experiments.map((e) => (
              <li key={e.id}>
                <span className="ink font-medium">{e.name}</span>{' '}
                <span className="muted">
                  · {fmtDate(toDate(e.startDate))}
                  {e.endDate ? ` → ${fmtDate(toDate(e.endDate))}` : ` (active)`}
                </span>
                {e.notes && <div className="text-[11.5px] muted ml-3 italic">{e.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {realizations.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">Realizations</h2>
          <ul className="text-[12.5px] ink-soft space-y-1">
            {realizations.slice(0, 12).map((r) => (
              <li key={r.id}>
                <span className="muted font-mono text-[11px]">{fmtDate(toDate(r.timestamp))}: </span>
                {r.content}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-heading text-[16px] tracking-head ink m-0 mb-2">
          Daily detail (last {Math.min(days, 14)} days)
        </h2>
        <table className="w-full text-[11.5px]" style={{ borderTop: '1px solid var(--border)' }}>
          <thead>
            <tr className="eyebrow text-left">
              <th className="py-1 pr-2" style={{ width: 90 }}>Date</th>
              <th className="py-1 pr-2">Foods</th>
              <th className="py-1 pr-2" style={{ width: 220 }}>Symptoms</th>
            </tr>
          </thead>
          <tbody>
            {tableDays.map((d, i) => (
              <tr
                key={i}
                className="align-top"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td className="py-1 pr-2 font-mono muted">{fmtDate(d.date)}</td>
                <td className="py-1 pr-2 ink-soft">
                  {d.foods.length === 0 ? <span className="muted">—</span> :
                    d.foods.map((f, k) => (
                      <span key={f.id}>
                        {k > 0 && ', '}{f.food}
                        {f.tags.length > 0 && <span className="muted"> ({f.tags.join('/')})</span>}
                      </span>
                    ))
                  }
                </td>
                <td className="py-1 pr-2 ink-soft">
                  {d.sympts.length === 0 ? <span className="muted">—</span> :
                    d.sympts.map((s, k) => (
                      <span key={s.id}>
                        {k > 0 && ', '}{s.type} <span className="muted">{s.severity}/10</span>
                      </span>
                    ))
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 pt-3 text-[10.5px] muted italic" style={{ borderTop: '1px solid var(--border)' }}>
        Generated from local Digestive Diary data on {fmtDate(new Date())}. Self-reported. Not a diagnostic tool.
      </footer>

      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .report-root { padding: 0 !important; }
          .screen-controls { display: none !important; }
          nav, .floating-chat, [aria-label="Bottom navigation"] { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="eyebrow">{label}</div>
      <div className="font-heading text-[22px] tracking-head ink mt-1">{value}</div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="px-6 py-8 muted">Loading…</div>}>
      <ReportContent />
    </Suspense>
  );
}
