import { isCloudEnabled, getSupabaseClient } from '../supabase/client';
import { useAppStore } from '../store';
import type {
  FoodLog,
  Symptom,
  Context,
  Experiment,
  ExperimentLog,
  Realization,
  Source,
  Recipe,
  PhotoUpload,
  AdminNotification,
} from '@/types';

type Row = Record<string, unknown>;

let syncUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSnapshot = '';
let syncInFlight = false;

function ts(v: Date | string | undefined): string {
  if (!v) return new Date().toISOString();
  return (v instanceof Date ? v : new Date(v)).toISOString();
}

function parseDate(v: unknown): Date {
  return new Date(String(v));
}

async function sb() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase unavailable');
  return client;
}

async function upsert(table: string, rows: Row[]) {
  if (!rows.length) return;
  const { error } = await (await sb()).from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.warn(`sync upsert ${table}:`, error.message);
}

async function remove(table: string, ids: string[]) {
  if (!ids.length || !syncUserId) return;
  const { error } = await (await sb()).from(table).delete().in('id', ids).eq('user_id', syncUserId);
  if (error) console.warn(`sync delete ${table}:`, error.message);
}

function isDemoData(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('demoDataCleared') !== 'true';
}

// ─── Mappers: local → DB ───────────────────────────────────────────────────

function foodToRow(f: FoodLog, uid: string): Row {
  return {
    id: f.id, user_id: uid, food: f.food, quantity: f.quantity ?? null,
    tags: f.tags, notes: f.notes ?? null, macros: f.macros ?? null,
    portion_weight: f.portionWeight ?? null, timestamp: ts(f.timestamp),
  };
}

function symptomToRow(s: Symptom, uid: string): Row {
  return {
    id: s.id, user_id: uid, type: s.type, severity: s.severity,
    duration: s.duration ?? null, notes: s.notes ?? null,
    linked_food_id: s.linkedFoodId ?? null, linked_symptom_id: s.linkedSymptomId ?? null,
    photo_url: s.photoUrl ?? null, ai_analysis: s.aiAnalysis ?? null,
    locations: s.locations ?? null, timestamp: ts(s.timestamp),
  };
}

function contextToRow(c: Context, uid: string): Row {
  return {
    id: c.id, user_id: uid,
    sleep_quality: c.sleepQuality ?? null, sleep_duration: c.sleepDuration ?? null,
    sleep_start_time: c.sleepStartTime ? ts(c.sleepStartTime) : null,
    sleep_end_time: c.sleepEndTime ? ts(c.sleepEndTime) : null,
    stress_level: c.stressLevel ?? null, activity_level: c.activityLevel ?? null,
    bowel_movement: c.bowelMovement ?? null, bowel_type: c.bowelType ?? null,
    bristol_type: c.bristolType ?? null, cycle_phase: c.cyclePhase ?? null,
    cycle_flow: c.cycleFlow ?? null, hydration_ml: c.hydrationMl ?? null,
    notes: c.notes ?? null, timestamp: ts(c.timestamp),
  };
}

function experimentToRow(e: Experiment, uid: string): Row {
  return {
    id: e.id, user_id: uid, name: e.name, notes: e.notes ?? null,
    start_date: ts(e.startDate), end_date: e.endDate ? ts(e.endDate) : null,
    active: e.active, fodmap: e.fodmap ?? null, target_days: e.targetDays ?? null,
  };
}

function expLogToRow(l: ExperimentLog, uid: string): Row {
  return {
    id: l.id, user_id: uid, experiment_id: l.experimentId,
    type: l.type, content: l.content, notes: l.notes ?? null, timestamp: ts(l.timestamp),
  };
}

// ─── Mappers: DB → local ───────────────────────────────────────────────────

function rowToFood(f: Row): FoodLog {
  return {
    id: String(f.id), food: String(f.food),
    quantity: f.quantity ? String(f.quantity) : undefined,
    tags: (f.tags as string[]) ?? [], notes: f.notes ? String(f.notes) : undefined,
    macros: f.macros as FoodLog['macros'],
    portionWeight: f.portion_weight as number | undefined,
    timestamp: parseDate(f.timestamp),
  };
}

function rowToSymptom(s: Row): Symptom {
  const ai = s.ai_analysis as Symptom['aiAnalysis'];
  return {
    id: String(s.id), type: String(s.type), severity: Number(s.severity) as Symptom['severity'],
    duration: s.duration ? String(s.duration) : undefined,
    notes: s.notes ? String(s.notes) : undefined,
    linkedFoodId: s.linked_food_id ? String(s.linked_food_id) : undefined,
    linkedSymptomId: s.linked_symptom_id ? String(s.linked_symptom_id) : undefined,
    photoUrl: s.photo_url ? String(s.photo_url) : undefined,
    locations: s.locations as Symptom['locations'],
    aiAnalysis: ai?.analysisTimestamp
      ? { ...ai, analysisTimestamp: parseDate(ai.analysisTimestamp) }
      : ai,
    timestamp: parseDate(s.timestamp),
  };
}

function rowToContext(c: Row): Context {
  return {
    id: String(c.id),
    sleepQuality: c.sleep_quality as Context['sleepQuality'],
    sleepDuration: c.sleep_duration as number | undefined,
    sleepStartTime: c.sleep_start_time ? parseDate(c.sleep_start_time) : undefined,
    sleepEndTime: c.sleep_end_time ? parseDate(c.sleep_end_time) : undefined,
    stressLevel: c.stress_level as Context['stressLevel'],
    activityLevel: c.activity_level as Context['activityLevel'],
    bowelMovement: c.bowel_movement as boolean | undefined,
    bowelType: c.bowel_type as Context['bowelType'],
    bristolType: c.bristol_type as Context['bristolType'],
    cyclePhase: c.cycle_phase as Context['cyclePhase'],
    cycleFlow: c.cycle_flow as Context['cycleFlow'],
    hydrationMl: c.hydration_ml as number | undefined,
    notes: c.notes ? String(c.notes) : undefined,
    timestamp: parseDate(c.timestamp),
  };
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  local.forEach((x) => map.set(x.id, x));
  remote.forEach((x) => map.set(x.id, x));
  return Array.from(map.values());
}

export function setSyncUserId(uid: string | null) {
  syncUserId = uid;
  lastSnapshot = '';
}

export async function pullAllFromCloud(): Promise<{ ok: boolean; reason?: string }> {
  if (!isCloudEnabled() || !syncUserId) return { ok: false, reason: 'not ready' };
  try {
    const client = await sb();
    const uid = syncUserId;
    const state = useAppStore.getState();

    const [foods, syms, ctxs, exps, expLogs, reals, srcs, recipes, photos, notifs, settingsRow] =
      await Promise.all([
        client.from('food_logs').select('*').eq('user_id', uid),
        client.from('symptoms').select('*').eq('user_id', uid),
        client.from('contexts').select('*').eq('user_id', uid),
        client.from('experiments').select('*').eq('user_id', uid),
        client.from('experiment_logs').select('*').eq('user_id', uid),
        client.from('realizations').select('*').eq('user_id', uid),
        client.from('sources').select('*').eq('user_id', uid),
        client.from('recipes').select('*').eq('user_id', uid),
        client.from('photo_uploads').select('*').eq('user_id', uid),
        client.from('admin_notifications').select('*').eq('user_id', uid),
        client.from('settings').select('*').eq('user_id', uid).maybeSingle(),
      ]);

    const localEmpty = state.foodLogs.length === 0 && state.symptoms.length === 0
      && state.contexts.length === 0 && state.experiments.length === 0;

    const remoteFoods = (foods.data ?? []).map(rowToFood);
    const remoteSyms = (syms.data ?? []).map(rowToSymptom);
    const remoteCtxs = (ctxs.data ?? []).map(rowToContext);

    const logsByExp = new Map<string, ExperimentLog[]>();
    (expLogs.data ?? []).forEach((l: Row) => {
      const log: ExperimentLog = {
        id: String(l.id), experimentId: String(l.experiment_id),
        type: l.type as ExperimentLog['type'], content: String(l.content),
        notes: l.notes ? String(l.notes) : undefined, timestamp: parseDate(l.timestamp),
      };
      const arr = logsByExp.get(log.experimentId) ?? [];
      arr.push(log);
      logsByExp.set(log.experimentId, arr);
    });

    const remoteExps: Experiment[] = (exps.data ?? []).map((e: Row) => ({
      id: String(e.id), name: String(e.name),
      startDate: parseDate(e.start_date),
      endDate: e.end_date ? parseDate(e.end_date) : undefined,
      active: Boolean(e.active),
      notes: e.notes ? String(e.notes) : undefined,
      fodmap: e.fodmap as Experiment['fodmap'],
      targetDays: e.target_days as number | undefined,
      logs: logsByExp.get(String(e.id)) ?? [],
    }));

    if (localEmpty && !isDemoData()) {
      state.setFoodLogs(remoteFoods);
      state.setSymptoms(remoteSyms);
      state.setContexts(remoteCtxs);
      state.setExperiments(remoteExps);
    } else if (remoteFoods.length || remoteSyms.length || remoteCtxs.length || remoteExps.length) {
      state.setFoodLogs(mergeById(state.foodLogs, remoteFoods));
      state.setSymptoms(mergeById(state.symptoms, remoteSyms));
      state.setContexts(mergeById(state.contexts, remoteCtxs));
      state.setExperiments(mergeById(state.experiments, remoteExps));
    }

    if (reals.data?.length) {
      state.setRealizations(mergeById(state.realizations, reals.data.map((r: Row) => ({
        id: String(r.id), content: String(r.content),
        linkedData: r.linked_data as import('@/types').Realization['linkedData'],
        aiOrganized: r.ai_organized ? String(r.ai_organized) : undefined,
        timestamp: parseDate(r.timestamp),
      }))));
    }
    if (srcs.data?.length) {
      state.setSources(mergeById(state.sources, srcs.data.map((s: Row) => ({
        id: String(s.id), title: String(s.title), type: s.type as Source['type'],
        url: s.url ? String(s.url) : undefined, filePath: s.file_path ? String(s.file_path) : undefined,
        description: s.description ? String(s.description) : undefined,
        author: s.author ? String(s.author) : undefined, content: s.content ? String(s.content) : undefined,
        tags: s.tags as string[] | undefined, addedAt: parseDate(s.added_at),
      }))));
    }
    if (recipes.data?.length) {
      state.setRecipes(mergeById(state.recipes, recipes.data.map((r: Row) => ({
        id: String(r.id), name: String(r.name),
        description: r.description ? String(r.description) : undefined,
        ingredients: (r.ingredients as string[]) ?? [],
        instructions: (r.instructions as string[]) ?? [],
        tags: (r.tags as string[]) ?? [],
        estimatedMacros: r.estimated_macros as Recipe['estimatedMacros'],
        sourceUrl: r.source_url ? String(r.source_url) : undefined,
        sourceName: r.source_name ? String(r.source_name) : undefined,
        aiGenerated: Boolean(r.ai_generated),
      }))));
    }

    if (settingsRow.data) {
      const s = settingsRow.data as Row;
      if (s.fasting) state.setFastingSettings(s.fasting as Parameters<typeof state.setFastingSettings>[0]);
      if (s.macro_goals !== undefined) state.setMacroGoals(s.macro_goals as Parameters<typeof state.setMacroGoals>[0]);
      if (s.auto_scan) state.setAutoScanSettings(s.auto_scan as Parameters<typeof state.setAutoScanSettings>[0]);
      if (s.recipe_sources) state.setRecipeSourcesSettings(s.recipe_sources as Parameters<typeof state.setRecipeSourcesSettings>[0]);
    }

    lastSnapshot = '';
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : 'pull failed' };
  }
}

export async function pushAllToCloud(): Promise<{ ok: boolean; reason?: string }> {
  if (!isCloudEnabled() || !syncUserId || syncInFlight) return { ok: false, reason: 'not ready' };
  if (isDemoData()) return { ok: false, reason: 'demo data — skipped' };

  syncInFlight = true;
  try {
    const uid = syncUserId;
    const s = useAppStore.getState();

    await upsert('food_logs', s.foodLogs.map((f) => foodToRow(f, uid)));
    await upsert('symptoms', s.symptoms.map((x) => symptomToRow(x, uid)));
    await upsert('contexts', s.contexts.map((c) => contextToRow(c, uid)));
    await upsert('experiments', s.experiments.map((e) => experimentToRow(e, uid)));

    const allExpLogs: ExperimentLog[] = [];
    s.experiments.forEach((e) => (e.logs ?? []).forEach((l) => allExpLogs.push({ ...l, experimentId: e.id })));
    await upsert('experiment_logs', allExpLogs.map((l) => expLogToRow(l, uid)));

    await upsert('realizations', s.realizations.map((r) => ({
      id: r.id, user_id: uid, content: r.content,
      linked_data: r.linkedData ?? null, ai_organized: r.aiOrganized ?? null,
      timestamp: ts(r.timestamp),
    })));

    await upsert('sources', s.sources.map((src) => ({
      id: src.id, user_id: uid, title: src.title, type: src.type,
      url: src.url ?? null, file_path: src.filePath ?? null,
      description: src.description ?? null, author: src.author ?? null,
      content: src.content ?? null, tags: src.tags ?? null, added_at: ts(src.addedAt),
    })));

    await upsert('recipes', s.recipes.map((r) => ({
      id: r.id, user_id: uid, name: r.name, description: r.description ?? null,
      ingredients: r.ingredients, instructions: r.instructions, tags: r.tags,
      estimated_macros: r.estimatedMacros ?? null, source_url: r.sourceUrl ?? null,
      source_name: r.sourceName ?? null, ai_generated: false,
      created_at: new Date().toISOString(),
    })));

    await upsert('photo_uploads', s.photoUploads.map((p) => ({
      id: p.id, user_id: uid, file_url: p.fileUrl,
      parsed_content: p.parsedContent ?? null, food_log_id: p.foodLogId ?? null,
      uploaded_at: ts(p.uploadedAt),
    })));

    await upsert('admin_notifications', s.adminNotifications.map((n) => ({
      id: n.id, user_id: uid, type: n.type, message: n.message,
      details: n.details ?? null, resolved: n.resolved, timestamp: ts(n.timestamp),
    })));

    await (await sb()).from('settings').upsert({
      user_id: uid,
      fasting: s.fastingSettings,
      macro_goals: s.macroGoals,
      auto_scan: s.autoScanSettings,
      recipe_sources: s.recipeSourcesSettings,
      updated_at: new Date().toISOString(),
    });

    lastSnapshot = JSON.stringify({
      food: s.foodLogs.map((x) => x.id),
      symptoms: s.symptoms.map((x) => x.id),
      contexts: s.contexts.map((x) => x.id),
      experiments: s.experiments.map((x) => x.id),
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : 'push failed' };
  } finally {
    syncInFlight = false;
  }
}

export async function syncOnSignIn(userId: string): Promise<void> {
  setSyncUserId(userId);
  await pullAllFromCloud();
  if (!isDemoData()) await pushAllToCloud();
}

export async function deleteAllCloudData(): Promise<void> {
  if (!syncUserId) return;
  const uid = syncUserId;
  const client = await sb();
  const tables = [
    'food_logs', 'symptoms', 'contexts', 'experiment_logs', 'experiments',
    'realizations', 'sources', 'recipes', 'photo_uploads', 'admin_notifications',
  ];
  await Promise.all(tables.map((t) => client.from(t).delete().eq('user_id', uid)));
  await client.from('settings').delete().eq('user_id', uid);
}

export function scheduleCloudPush() {
  if (!isCloudEnabled() || !syncUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushAllToCloud().catch(() => {});
  }, 2500);
}

export function getSyncStatus(): { userId: string | null; enabled: boolean } {
  return { userId: syncUserId, enabled: isCloudEnabled() && !!syncUserId };
}
