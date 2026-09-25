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

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  const sb = getSupabaseClient();
  if (!sb || rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.warn(`migrate ${table}:`, error.message);
}

export async function migrateLocalToCloudIfNeeded(): Promise<{ migrated: boolean; reason?: string }> {
  if (migratedThisSession) return { migrated: false, reason: 'already migrated this session' };
  const status = await getAdapterStatus();
  if (!status.cloud || !status.ready || !status.userId) return { migrated: false, reason: status.reason || 'not ready' };
  const state = useAppStore.getState();
  const uid = status.userId;

  try {
    await upsertRows('food_logs', state.foodLogs.map((f) => ({
      id: f.id, user_id: uid, food: f.food, quantity: f.quantity ?? null,
      tags: f.tags, notes: f.notes ?? null, macros: f.macros ?? null,
      portion_weight: f.portionWeight ?? null, timestamp: f.timestamp,
    })));
    await upsertRows('symptoms', state.symptoms.map((s) => ({
      id: s.id, user_id: uid, type: s.type, severity: s.severity,
      duration: s.duration ?? null, notes: s.notes ?? null,
      linked_food_id: s.linkedFoodId ?? null, linked_symptom_id: s.linkedSymptomId ?? null,
      photo_url: s.photoUrl ?? null, ai_analysis: s.aiAnalysis ?? null, timestamp: s.timestamp,
    })));
    await upsertRows('contexts', state.contexts.map((c) => ({
      id: c.id, user_id: uid, sleep_quality: c.sleepQuality ?? null,
      sleep_duration: c.sleepDuration ?? null, sleep_start_time: c.sleepStartTime ?? null,
      sleep_end_time: c.sleepEndTime ?? null, stress_level: c.stressLevel ?? null,
      activity_level: c.activityLevel ?? null, bowel_movement: c.bowelMovement ?? null,
      bowel_type: c.bowelType ?? null, notes: c.notes ?? null, timestamp: c.timestamp,
    })));
    await upsertRows('experiments', state.experiments.map((e) => ({
      id: e.id, user_id: uid, name: e.name, notes: e.notes ?? null,
      start_date: e.startDate, end_date: e.endDate ?? null, active: e.active,
    })));
    migratedThisSession = true;
    return { migrated: true };
  } catch (e: unknown) {
    return { migrated: false, reason: e instanceof Error ? e.message : 'migration error' };
  }
}

export async function pullCloudToLocalIfEmpty(): Promise<void> {
  const status = await getAdapterStatus();
  if (!status.ready || !status.userId) return;
  const sb = getSupabaseClient();
  if (!sb) return;

  const state = useAppStore.getState();
  if (state.foodLogs.length > 0 || state.symptoms.length > 0) return;

  const { data: foods } = await sb.from('food_logs').select('*').eq('user_id', status.userId);
  if (!foods?.length) return;

  state.setFoodLogs(
    foods.map((f: Record<string, unknown>) => ({
      id: String(f.id),
      food: String(f.food),
      quantity: f.quantity ? String(f.quantity) : undefined,
      tags: (f.tags as string[]) ?? [],
      notes: f.notes ? String(f.notes) : undefined,
      macros: f.macros as import('@/types').FoodLog['macros'],
      portionWeight: f.portion_weight as number | undefined,
      timestamp: new Date(String(f.timestamp)),
    }))
  );
}
