import { isCloudEnabled, getSupabaseClient } from './supabase/client';

export interface AdapterStatus {
  cloud: boolean;
  ready: boolean;
  userId: string | null;
  reason?: string;
}

export {
  pullAllFromCloud,
  pushAllToCloud,
  syncOnSignIn,
  deleteAllCloudData,
  scheduleCloudPush,
  setSyncUserId,
  getSyncStatus,
} from './sync/cloudSync';

/** @deprecated use syncOnSignIn */
export async function migrateLocalToCloudIfNeeded() {
  const { pushAllToCloud } = await import('./sync/cloudSync');
  return pushAllToCloud();
}

/** @deprecated use pullAllFromCloud */
export async function pullCloudToLocalIfEmpty() {
  const { pullAllFromCloud } = await import('./sync/cloudSync');
  await pullAllFromCloud();
}

export async function getAdapterStatus(): Promise<AdapterStatus> {
  if (!isCloudEnabled()) return { cloud: false, ready: true, userId: null, reason: 'NEXT_PUBLIC_USE_CLOUD!=true' };
  const sb = getSupabaseClient();
  if (!sb) return { cloud: true, ready: false, userId: null, reason: 'Supabase client unavailable' };
  try {
    const { data, error } = await sb.auth.getUser();
    if (error) return { cloud: true, ready: false, userId: null, reason: error.message };
    return { cloud: true, ready: !!data?.user, userId: data?.user?.id ?? null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'auth error';
    return { cloud: true, ready: false, userId: null, reason: msg };
  }
}
