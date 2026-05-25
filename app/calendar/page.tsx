'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import PageHeader from '@/components/ui/PageHeader';
import { IconChevL, IconChevR, Dot } from '@/components/ui/Icon';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function CalendarPage() {
  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const counts = useMemo(() => {
    const map = new Map<string, { food: number; sym: number }>();
    foodLogs.forEach((l) => {
      const d = toDate(l.timestamp);
      const k = dayKey(d);
      const cur = map.get(k) ?? { food: 0, sym: 0 };
      cur.food++;
      map.set(k, cur);
    });
    symptoms.forEach((s) => {
      const d = toDate(s.timestamp);
      const k = dayKey(d);
      const cur = map.get(k) ?? { food: 0, sym: 0 };
      cur.sym++;
      map.set(k, cur);
    });
    return map;
  }, [foodLogs, symptoms]);

  const cells: Array<{ d: number; date: Date } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, date: new Date(year, month, d) });

  const selectedDayFoods = useMemo(() => {
    const k = dayKey(selectedDate);
    return foodLogs.filter((l) => dayKey(toDate(l.timestamp)) === k)
      .sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime());
  }, [foodLogs, selectedDate]);

  const selectedDaySymptoms = useMemo(() => {
    const k = dayKey(selectedDate);
    return symptoms.filter((s) => dayKey(toDate(s.timestamp)) === k)
      .sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime());
  }, [symptoms, selectedDate]);

  const shiftMonth = (delta: number) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Calendar"
        title={monthName}
        action={
          <div className="flex gap-1">
            <button onClick={() => shiftMonth(-1)} className="pill" style={{ padding: '6px 8px' }}><IconChevL size={14} /></button>
            <button onClick={() => shiftMonth(1)} className="pill" style={{ padding: '6px 8px' }}><IconChevR size={14} /></button>
          </div>
        }
      />

      <div className="px-5 grid grid-cols-7 gap-1 eyebrow text-center mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="px-5 pb-4 grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={i} className="aspect-square" />;
          const isToday = c.date.getTime() === today.getTime();
          const isSelected = dayKey(c.date) === dayKey(selectedDate);
          const future = c.date.getTime() > today.getTime();
          const data = counts.get(dayKey(c.date)) || { food: 0, sym: 0 };
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(c.date)}
              className="aspect-square relative rounded-card flex flex-col p-1 transition-colors text-left"
              style={{
                border: isToday ? '1.5px solid var(--accent)' : isSelected ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                background: isToday
                  ? 'var(--accent-soft)'
                  : future
                  ? 'transparent'
                  : data.food >= 4 ? 'var(--surface-alt)' : 'var(--surface)',
                opacity: future ? 0.35 : 1,
              }}
            >
              <span
                className="font-mono text-[10.5px]"
                style={{
                  color: isToday ? 'var(--accent)' : 'var(--ink-soft)',
                  fontWeight: isToday ? 700 : 500,
                }}
              >
                {c.d}
              </span>
              <div className="mt-auto flex gap-0.5">
                {Array.from({ length: Math.min(data.sym, 5) }).map((_, k) => (
                  <Dot key={k} size={4} color="var(--accent)" />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mx-5 pb-3 flex items-center gap-3.5 text-[11px] muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
          active day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dot size={5} color="var(--accent)" /> symptom
        </span>
      </div>

      <section className="px-5 pb-10">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="m-0 font-heading text-[18px] tracking-head ink">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          <span className="eyebrow">{selectedDayFoods.length} meals · {selectedDaySymptoms.length} symptoms</span>
        </div>
        <div className="card p-3.5">
          {[...selectedDayFoods, ...selectedDaySymptoms].length === 0 ? (
            <div className="muted text-[13px]">Nothing logged this day.</div>
          ) : (
            [...selectedDayFoods.map((f) => ({ kind: 'food' as const, ...f })),
             ...selectedDaySymptoms.map((s) => ({ kind: 'symptom' as const, ...s }))]
              .sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime())
              .map((it, i, arr) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : undefined }}
                >
                  <span className="font-mono text-[11px] muted w-11">{fmt(toDate(it.timestamp))}</span>
                  <span className="flex-1 text-[13.5px] ink">
                    {it.kind === 'food' ? (it as any).food : (it as any).type}
                  </span>
                  {it.kind === 'symptom' && (
                    <span className="font-mono text-[11px] text-accent">S{(it as any).severity}</span>
                  )}
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
