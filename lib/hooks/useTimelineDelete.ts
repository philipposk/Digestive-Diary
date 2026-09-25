'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/components/ui/ConfirmProvider';

export type DeleteTarget =
  | { type: 'food'; id: string }
  | { type: 'symptom'; id: string }
  | { type: 'context'; id: string }
  | { type: 'medicationLog'; id: string }
  | { type: 'customFactorLog'; id: string };

export function useTimelineDelete() {
  const confirm = useConfirm();
  const deleteFoodLog = useAppStore((s) => s.deleteFoodLog);
  const deleteSymptom = useAppStore((s) => s.deleteSymptom);
  const deleteContext = useAppStore((s) => s.deleteContext);
  const deleteMedicationLog = useAppStore((s) => s.deleteMedicationLog);
  const deleteCustomFactorLog = useAppStore((s) => s.deleteCustomFactorLog);

  return useCallback(async (target: DeleteTarget, label: string) => {
    const ok = await confirm({
      title: 'Delete this entry?',
      message: `Remove "${label}" from your diary. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    switch (target.type) {
      case 'food': deleteFoodLog(target.id); break;
      case 'symptom': deleteSymptom(target.id); break;
      case 'context': deleteContext(target.id); break;
      case 'medicationLog': deleteMedicationLog(target.id); break;
      case 'customFactorLog': deleteCustomFactorLog(target.id); break;
    }
  }, [confirm, deleteFoodLog, deleteSymptom, deleteContext, deleteMedicationLog, deleteCustomFactorLog]);
}
