// Storage adapter: routes reads/writes to localStorage (default) or Supabase (when
// NEXT_PUBLIC_USE_CLOUD=true AND the user is signed in).
//
// Why an adapter? The whole app already runs on Zustand+localStorage. We want to
// flip on Supabase without rewriting every page. Until cloud mode is enabled this
// module is a thin pass-through over the existing store; once enabled, page-level
// callers can opt in by awaiting these helpers instead of reading the store directly.
//
// First-sign-in migration: on the first successful cloud session this module
// uploads localStorage state into Supabase (food_logs, symptoms, contexts, etc.).
// Skeleton only — wire up the actual mutations when you implement Auth UI.

import { isCloudEnabled, getSupabaseClient } from './supabase/client';
import { useAppStore } from './store';

export interface AdapterStatus {
  cloud: boolean;
  ready: boolean;
  userId: string | null;
  reason?: string;
}

let migratedThisSession = false;

export async function getAdapterStatus(): Promise<AdapterStatus> {
  if (!isCloudEnabled()) return { cloud: false, ready: true, userId: null, reason: 'NEXT_PUBLIC_USE_CLOUD!=true' };
  const sb: any = getSupabaseClient();
  if (!sb) return { cloud: true, ready: false, userId: null, reason: 'Supabase client unavailable' };
  try {
    const { data, error } = await sb.auth.getUser();
    if (error) return { cloud: true, ready: false, userId: null, reason: error.message };
    return { cloud: true, ready: !!data?.user, userId: data?.user?.id ?? null };
  } catch (e: any) {
    return { cloud: true, ready: false, userId: null, reason: e?.message || 'auth error' };
  }
}

// One-shot migration. Idempotent within a session via in-memory flag.
export async function migrateLocalToCloudIfNeeded(): Promise<{ migrated: boolean; reason?: string }> {
  if (migratedThisSession) return { migrated: false, reason: 'already migrated this session' };
  const status = await getAdapterStatus();
  if (!status.cloud || !status.ready || !status.userId) return { migrated: false, reason: status.reason || 'not ready' };
  const sb: any = getSupabaseClient();
  if (!sb) return { migrated: false, reason: 'no client' };

  const state = useAppStore.getState();

  const inserts = [
    sb.from('food_logs').insert(state.foodLogs.map((f) => ({
      id: f.id,
      user_id: status.userId,
      food: f.food,
      quantity: f.quantity ?? null,
      tags: f.tags,
      notes: f.notes ?? null,
      macros: f.macros ?? null,
      portion_weight: f.portionWeight ?? null,
      timestamp: f.timestamp,
    }))),
    sb.from('symptoms').insert(state.symptoms.map((s) => ({
      id: s.id,
      user_id: status.userId,
      type: s.type,
      severity: s.severity,
      duration: s.duration ?? null,
      notes: s.notes ?? null,
      linked_food_id: s.linkedFoodId ?? null,
      linked_symptom_id: s.linkedSymptomId ?? null,
      photo_url: s.photoUrl ?? null,
      ai_analysis: s.aiAnalysis ?? null,
      timestamp: s.timestamp,
    }))),
    sb.from('contexts').insert(state.contexts.map((c) => ({
      id: c.id,
      user_id: status.userId,
      sleep_quality: c.sleepQuality ?? null,
      sleep_duration: c.sleepDuration ?? null,
      sleep_start_time: c.sleepStartTime ?? null,
      sleep_end_time: c.sleepEndTime ?? null,
      stress_level: c.stressLevel ?? null,
      activity_level: c.activityLevel ?? null,
      bowel_movement: c.bowelMovement ?? null,
      bowel_type: c.bowelType ?? null,
      notes: c.notes ?? null,
      timestamp: c.timestamp,
    }))),
  ];

  try {
    for (const ins of inserts) {
      const { error } = await ins;
      if (error) console.warn('migrateLocalToCloud insert failed:', error.message);
    }
    migratedThisSession = true;
    return { migrated: true };
  } catch (e: any) {
    return { migrated: false, reason: e?.message || 'migration error' };
  }
}
