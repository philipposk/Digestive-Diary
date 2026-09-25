'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { IconClose } from '@/components/ui/Icon';
import { useModalA11y } from '@/lib/hooks/useModalA11y';
import type { TimelineEditTarget } from '@/lib/hooks/useTimelineEdit';

interface Props {
  isOpen: boolean;
  target: Extract<TimelineEditTarget, { type: 'medicationLog' | 'customFactorLog' }> | null;
  onClose: () => void;
}

export default function TimelineQuickEditModal({ isOpen, target, onClose }: Props) {
  const { overlayProps } = useModalA11y(isOpen, onClose, 'timeline-quick-edit-title');
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);
  const updateMedicationLog = useAppStore((s) => s.updateMedicationLog);
  const updateCustomFactorLog = useAppStore((s) => s.updateCustomFactorLog);

  const [notes, setNotes] = useState('');
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !target) {
      setNotes('');
      setValue(0);
      return;
    }
    if (target.type === 'medicationLog') {
      const log = medicationLogs.find((l) => l.id === target.id);
      setNotes(log?.notes ?? '');
      return;
    }
    const log = customFactorLogs.find((l) => l.id === target.id);
    setNotes(log?.notes ?? '');
    setValue(log?.value ?? 0);
  }, [isOpen, target, medicationLogs, customFactorLogs]);

  if (!isOpen || !target) return null;

  const factor = target.type === 'customFactorLog'
    ? customFactors.find((f) => f.id === customFactorLogs.find((l) => l.id === target.id)?.factorId)
    : null;
  const med = target.type === 'medicationLog'
    ? medications.find((m) => m.id === medicationLogs.find((l) => l.id === target.id)?.medicationId)
    : null;

  const title = target.type === 'medicationLog'
    ? `Edit ${med?.name ?? 'medication'}`
    : `Edit ${factor?.label ?? 'factor'}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target.type === 'medicationLog') {
      updateMedicationLog(target.id, { notes: notes.trim() || undefined });
    } else {
      updateCustomFactorLog(target.id, {
        value: factor?.scale === 'yesno' ? (value ? 1 : 0) : value,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
      {...overlayProps}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-app"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div className="px-5 pt-2.5 pb-6">
          <div className="mx-auto w-10 h-1 rounded-full mb-3" style={{ background: 'var(--border-strong)' }} />
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="timeline-quick-edit-title" className="m-0 font-heading text-[22px] tracking-head ink">{title}</h2>
            <button type="button" onClick={onClose} className="muted hover:text-ink" aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {target.type === 'customFactorLog' && factor && factor.scale !== 'yesno' && (
              <label className="block">
                <span className="eyebrow">Value{factor.unit ? ` (${factor.unit})` : ''}</span>
                <input
                  type="number"
                  min={factor.scale === 'severity' ? 0 : undefined}
                  max={factor.scale === 'severity' ? 10 : undefined}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="input mt-1.5 w-full"
                />
              </label>
            )}
            {target.type === 'customFactorLog' && factor?.scale === 'yesno' && (
              <label className="flex items-center gap-2 text-[14px] ink-soft">
                <input
                  type="checkbox"
                  checked={value > 0}
                  onChange={(e) => setValue(e.target.checked ? 1 : 0)}
                />
                Yes
              </label>
            )}
            <label className="block">
              <span className="eyebrow">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input mt-1.5 w-full resize-none"
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-full font-medium"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              Save changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
