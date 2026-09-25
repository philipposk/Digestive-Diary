'use client';

import { useCallback, useState } from 'react';

export type TimelineEditTarget =
  | { type: 'food'; id: string }
  | { type: 'symptom'; id: string }
  | { type: 'context'; id: string }
  | { type: 'medicationLog'; id: string }
  | { type: 'customFactorLog'; id: string };

export function useTimelineEdit() {
  const [target, setTarget] = useState<TimelineEditTarget | null>(null);

  const openEdit = useCallback((next: TimelineEditTarget) => setTarget(next), []);
  const closeEdit = useCallback(() => setTarget(null), []);

  return { target, openEdit, closeEdit };
}
