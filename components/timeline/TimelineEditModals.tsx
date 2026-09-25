'use client';

import LogFoodModal from '@/components/modals/LogFoodModal';
import LogSymptomModal from '@/components/modals/LogSymptomModal';
import LogContextModal from '@/components/modals/LogContextModal';
import TimelineQuickEditModal from '@/components/modals/TimelineQuickEditModal';
import type { TimelineEditTarget } from '@/lib/hooks/useTimelineEdit';

interface Props {
  target: TimelineEditTarget | null;
  onClose: () => void;
}

export default function TimelineEditModals({ target, onClose }: Props) {
  const editId = target?.id ?? null;

  return (
    <>
      <LogFoodModal
        isOpen={target?.type === 'food'}
        editId={target?.type === 'food' ? editId : null}
        onClose={onClose}
      />
      <LogSymptomModal
        isOpen={target?.type === 'symptom'}
        editId={target?.type === 'symptom' ? editId : null}
        onClose={onClose}
      />
      <LogContextModal
        isOpen={target?.type === 'context'}
        editId={target?.type === 'context' ? editId : null}
        onClose={onClose}
      />
      <TimelineQuickEditModal
        isOpen={target?.type === 'medicationLog' || target?.type === 'customFactorLog'}
        target={target?.type === 'medicationLog' || target?.type === 'customFactorLog' ? target : null}
        onClose={onClose}
      />
    </>
  );
}
