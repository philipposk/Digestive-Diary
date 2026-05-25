'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import PageHeader from '@/components/ui/PageHeader';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

const ROWS: Array<{ key: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'; label: string; unit: string }> = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein',  label: 'Protein',  unit: 'g' },
  { key: 'carbs',    label: 'Carbs',    unit: 'g' },
  { key: 'fat',      label: 'Fat',      unit: 'g' },
  { key: 'fiber',    label: 'Fiber',    unit: 'g' },
];

export default function MacrosPage() {
  const foodLogs = useAppStore((s) => s.foodLogs);
  const macroGoals = useAppStore((s) => s.macroGoals);
  const setMacroGoals = useAppStore((s) => s.setMacroGoals);

  const totals = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return foodLogs
      .filter((l) => {
        const t = toDate(l.timestamp); t.setHours(0, 0, 0, 0);
        return t.getTime() === today.getTime();
      })
      .reduce(
        (acc, l) => ({
          calories: acc.calories + (l.macros?.calories || 0),
          protein:  acc.protein  + (l.macros?.protein  || 0),
          carbs:    acc.carbs    + (l.macros?.carbs    || 0),
          fat:      acc.fat      + (l.macros?.fat      || 0),
          fiber:    acc.fiber    + (l.macros?.fiber    || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );
  }, [foodLogs]);

  const today = new Date();
  const dateLine = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateSub = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={`Macros · ${dateSub}`}
        title={dateLine}
        subtitle="Optional goals. Not a calorie counter; macros are for context, not judgment."
      />

      <section className="px-5 mb-6">
        <div className="card p-4 space-y-3.5">
          {ROWS.map((row) => {
            const current = totals[row.key];
            const goal = macroGoals?.[row.key];
            const pct = goal ? Math.min(100, (current / goal) * 100) : 0;
            return (
              <div key={row.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[13px] ink font-medium">{row.label}</span>
                  <span className="font-mono text-[12px] muted">
                    {current.toFixed(0)} {row.unit}{goal ? ` / ${goal} ${row.unit}` : ''}
                  </span>
                </div>
                {goal ? (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>
                ) : (
                  <div className="text-[11.5px] muted">No goal set</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-10">
        <h2 className="m-0 mb-2 font-heading text-[17px] tracking-head ink">Daily goals</h2>
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {ROWS.map((row) => (
              <label key={row.key} className="block">
                <span className="eyebrow">{row.label} ({row.unit})</span>
                <input
                  type="number"
                  value={macroGoals?.[row.key] ?? ''}
                  onChange={(e) =>
                    setMacroGoals({
                      ...macroGoals,
                      [row.key]: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="—"
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => setMacroGoals(null)}
            className="text-[12px] text-accent hover:underline"
          >
            Clear all goals
          </button>
        </div>
      </section>
    </div>
  );
}
