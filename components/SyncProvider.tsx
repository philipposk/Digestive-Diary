'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { isCloudEnabled } from '@/lib/supabase/client';
import { scheduleCloudPush, getSyncStatus } from '@/lib/sync/cloudSync';

/** Debounced push to Supabase whenever local store changes while signed in. */
export default function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isCloudEnabled()) return;

    const unsub = useAppStore.subscribe(() => {
      if (getSyncStatus().userId) scheduleCloudPush();
    });

    return unsub;
  }, []);

  return <>{children}</>;
}
