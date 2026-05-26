'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { CustomFactorScale, Medication } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import { IconPlus, IconTrash, IconClose } from '@/components/ui/Icon';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const fmt = (d: Date) =>
  `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function FactorsPage() {
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);

  const addMedication = useAppStore((s) => s.addMedication);
  const updateMedication = useAppStore((s) => s.updateMedication);
  const deleteMedication = useAppStore((s) => s.deleteMedication);
  const addMedicationLog = useAppStore((s) => s.addMedicationLog);
  const deleteMedicationLog = useAppStore((s) => s.deleteMedicationLog);

  const addCustomFactor = useAppStore((s) => s.addCustomFactor);
  const deleteCustomFactor = useAppStore((s) => s.deleteCustomFactor);
  const addCustomFactorLog = useAppStore((s) => s.addCustomFactorLog);

  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medNotes, setMedNotes] = useState('');

  const [showFactorModal, setShowFactorModal] = useState(false);
  const [factorLabel, setFactorLabel] = useState('');
  const [factorScale, setFactorScale] = useState<CustomFactorScale>('severity');
  const [factorUnit, setFactorUnit] = useState('');

  const recentLogsByMed = useMemo(() => {
    const m = new Map<string, number>();
    medicationLogs.forEach((l) => {
      m.set(l.medicationId, (m.get(l.medicationId) ?? 0) + 1);
    });
    return m;
  }, [medicationLogs]);

  const recentLogsByFactor = useMemo(() => {
    const m = new Map<string, { count: number; lastValue: number; lastAt: Date }>();
    customFactorLogs.forEach((l) => {
      const cur = m.get(l.factorId);
      if (!cur) m.set(l.factorId, { count: 1, lastValue: l.value, lastAt: toDate(l.timestamp) });
      else {
        cur.count += 1;
        if (toDate(l.timestamp) > cur.lastAt) {
          cur.lastAt = toDate(l.timestamp);
          cur.lastValue = l.value;
        }
      }
    });
    return m;
  }, [customFactorLogs]);

  const saveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedication({
      name: medName.trim(),
      dose: medDose.trim() || undefined,
      notes: medNotes.trim() || undefined,
      active: true,
    });
    setMedName(''); setMedDose(''); setMedNotes('');
    setShowMedModal(false);
  };

  const saveFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorLabel.trim()) return;
    addCustomFactor({
      label: factorLabel.trim(),
      scale: factorScale,
      unit: factorUnit.trim() || undefined,
      active: true,
    });
    setFactorLabel(''); setFactorScale('severity'); setFactorUnit('');
    setShowFactorModal(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Track"
        title="Medications & factors"
        subtitle="Log meds you take and define your own variables (mood, focus, anything)."
      />

      {/* ─── Medications ──────────────────────────────────────── */}
      <section className="px-5 pb-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="m-0 font-heading text-[17px] tracking-head ink">Medications</h2>
          <button
            onClick={() => setShowMedModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconPlus size={12} /> Add medication
          </button>
        </div>
        {medications.length === 0 ? (
          <div className="card p-4 muted text-[13px]">No medications yet.</div>
        ) : (
          <div className="space-y-2">
            {medications.map((m) => {
              const taken = recentLogsByMed.get(m.id) ?? 0;
              return (
                <article key={m.id} className="card p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[14.5px] font-medium ink truncate">{m.name}</span>
                        {m.dose && <span className="font-mono text-[11.5px] muted">{m.dose}</span>}
                        {!m.active && <span className="eyebrow">inactive</span>}
                      </div>
                      {m.notes && <p className="m-0 text-[12.5px] ink-soft mt-1">{m.notes}</p>}
                      <div className="eyebrow mt-2">Taken {taken}× total</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => addMedicationLog({ medicationId: m.id })}
                        className="px-2.5 py-1 rounded-full text-[11.5px]"
                        style={{ background: 'var(--accent)', color: 'var(--surface)' }}
                      >
                        Log dose
                      </button>
                      <button
                        onClick={() => updateMedication(m.id, { active: !m.active })}
                        className="text-[11.5px] muted hover:text-ink"
                      >
                        {m.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${m.name} and its log history?`)) deleteMedication(m.id);
                        }}
                        aria-label="Delete"
                        className="muted hover:text-ink self-end"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {medicationLogs.length > 0 && (
          <div className="mt-4">
            <div className="eyebrow mb-1.5">Recent doses</div>
            <div className="card p-3 max-h-48 overflow-y-auto">
              {medicationLogs.slice(0, 20).map((l) => {
                const med = medications.find((m) => m.id === l.medicationId);
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 py-1.5 text-[12.5px]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="font-mono muted">{fmt(toDate(l.timestamp))}</span>
                    <span className="ink-soft flex-1 truncate">{med?.name ?? 'Deleted medication'}{med?.dose ? ` · ${med.dose}` : ''}</span>
                    <button
                      onClick={() => deleteMedicationLog(l.id)}
                      aria-label="Delete log"
                      className="muted hover:text-ink"
                    >
                      <IconClose size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─── Custom factors ──────────────────────────────────────── */}
      <section className="px-5 pb-12">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="m-0 font-heading text-[17px] tracking-head ink">Custom factors</h2>
          <button
            onClick={() => setShowFactorModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconPlus size={12} /> Add factor
          </button>
        </div>
        {customFactors.length === 0 ? (
          <div className="card p-4 muted text-[13px]">
            Define your own variables to track alongside food and symptoms (e.g. mood, focus, headache).
          </div>
        ) : (
          <div className="space-y-2">
            {customFactors.map((f) => {
              const stat = recentLogsByFactor.get(f.id);
              return (
                <article key={f.id} className="card p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[14.5px] font-medium ink truncate">{f.label}</span>
                        <span className="eyebrow">{f.scale}{f.unit ? ` · ${f.unit}` : ''}</span>
                      </div>
                      {stat && (
                        <div className="text-[12px] muted mt-0.5">
                          Last: {f.scale === 'yesno' ? (stat.lastValue ? 'yes' : 'no') : stat.lastValue}
                          {' '}({fmt(stat.lastAt)}) · {stat.count} logs
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FactorQuickLog factor={f} onLog={(value) => addCustomFactorLog({ factorId: f.id, value })} />
                      <button
                        onClick={() => {
                          if (confirm(`Delete factor "${f.label}" and its log history?`)) deleteCustomFactor(f.id);
                        }}
                        aria-label="Delete"
                        className="muted hover:text-ink self-end"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Medication modal ──────────────────────────── */}
      {showMedModal && (
        <Modal onClose={() => setShowMedModal(false)} title="Add medication">
          <form onSubmit={saveMed}>
            <label className="block">
              <span className="eyebrow">Name</span>
              <input
                autoFocus
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Mebeverine"
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>
            <label className="block mt-3">
              <span className="eyebrow">Dose (optional)</span>
              <input
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="200 mg, 1 capsule, etc."
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>
            <label className="block mt-3">
              <span className="eyebrow">Notes (optional)</span>
              <textarea
                rows={2}
                value={medNotes}
                onChange={(e) => setMedNotes(e.target.value)}
                placeholder="When you take it, side effects to watch, etc."
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowMedModal(false)}
                className="px-3 py-2 rounded-full text-[13px]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!medName.trim()}
                className="flex-1 px-3 py-2 rounded-full text-[13px] disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Factor modal ──────────────────────────────── */}
      {showFactorModal && (
        <Modal onClose={() => setShowFactorModal(false)} title="Add custom factor">
          <form onSubmit={saveFactor}>
            <label className="block">
              <span className="eyebrow">Label</span>
              <input
                autoFocus
                value={factorLabel}
                onChange={(e) => setFactorLabel(e.target.value)}
                placeholder="e.g. Mood, Focus, Headache"
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>
            <label className="block mt-3">
              <span className="eyebrow">Scale</span>
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                {(['severity', 'yesno', 'number'] as CustomFactorScale[]).map((s) => {
                  const on = factorScale === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFactorScale(s)}
                      className="px-3 py-1.5 rounded-full text-[12px] capitalize"
                      style={{
                        background: on ? 'var(--ink)' : 'transparent',
                        color: on ? 'var(--bg)' : 'var(--ink-soft)',
                        border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                      }}
                    >
                      {s === 'severity' ? '1-10' : s === 'yesno' ? 'Yes / no' : 'Number'}
                    </button>
                  );
                })}
              </div>
            </label>
            {factorScale === 'number' && (
              <label className="block mt-3">
                <span className="eyebrow">Unit (optional)</span>
                <input
                  value={factorUnit}
                  onChange={(e) => setFactorUnit(e.target.value)}
                  placeholder="mg, ml, minutes, etc."
                  className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowFactorModal(false)}
                className="px-3 py-2 rounded-full text-[13px]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!factorLabel.trim()}
                className="flex-1 px-3 py-2 rounded-full text-[13px] disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FactorQuickLog({
  factor,
  onLog,
}: {
  factor: { id: string; scale: CustomFactorScale; unit?: string };
  onLog: (value: number) => void;
}) {
  const [value, setValue] = useState<number>(factor.scale === 'severity' ? 5 : 0);
  if (factor.scale === 'yesno') {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onLog(1)}
          className="px-2.5 py-1 rounded-full text-[11.5px]"
          style={{ background: 'var(--accent)', color: 'var(--surface)' }}
        >
          Yes
        </button>
        <button
          onClick={() => onLog(0)}
          className="px-2.5 py-1 rounded-full text-[11.5px]"
          style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
        >
          No
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-1.5 items-center">
      <input
        type="number"
        min={factor.scale === 'severity' ? 1 : undefined}
        max={factor.scale === 'severity' ? 10 : undefined}
        step={factor.scale === 'severity' ? 1 : 0.1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-16 px-2 py-1 rounded-card text-[12px] ink bg-app outline-none"
        style={{ border: '1px solid var(--border)' }}
      />
      <button
        onClick={() => onLog(value)}
        className="px-2.5 py-1 rounded-full text-[11.5px]"
        style={{ background: 'var(--accent)', color: 'var(--surface)' }}
      >
        Log
      </button>
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
