// JSON export / import + optional client-side encryption.
// Encryption uses Web Crypto only (AES-GCM 256 + PBKDF2-SHA-256). No external deps.
// Encrypted format is a JSON envelope: { v: 1, kdf: 'PBKDF2', iter, salt, iv, ciphertext }
// All payload fields base64-encoded.

import { useAppStore } from './store';

const APP_VERSION = 1;
const PBKDF2_ITER = 250_000;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  app: 'digestive-diary';
  state: {
    foodLogs: unknown[];
    symptoms: unknown[];
    contexts: unknown[];
    experiments: unknown[];
    realizations: unknown[];
    sources: unknown[];
    photoUploads: unknown[];
    recipes: unknown[];
    fastingSettings: unknown;
    macroGoals: unknown;
    autoScanSettings: unknown;
    recipeSourcesSettings: unknown;
    adminNotifications: unknown[];
    chatSession: unknown;
  };
}

export function buildBackupPayload(): BackupPayload {
  const s = useAppStore.getState();
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'digestive-diary',
    state: {
      foodLogs: s.foodLogs,
      symptoms: s.symptoms,
      contexts: s.contexts,
      experiments: s.experiments,
      realizations: s.realizations,
      sources: s.sources,
      photoUploads: s.photoUploads,
      recipes: s.recipes,
      fastingSettings: s.fastingSettings,
      macroGoals: s.macroGoals,
      autoScanSettings: s.autoScanSettings,
      recipeSourcesSettings: s.recipeSourcesSettings,
      adminNotifications: s.adminNotifications,
      chatSession: s.chatSession,
    },
  };
}

export function applyBackupPayload(p: BackupPayload) {
  if (!p || p.app !== 'digestive-diary' || !p.state) {
    throw new Error('Not a Digestive Diary backup file');
  }
  const s = useAppStore.getState();
  const reviveDates = (arr: any[], keys: string[]) =>
    arr.map((item) => {
      const out = { ...item };
      keys.forEach((k) => { if (out[k]) out[k] = new Date(out[k]); });
      return out;
    });

  s.setFoodLogs(reviveDates(p.state.foodLogs as any[], ['timestamp']) as any);
  s.setSymptoms(reviveDates(p.state.symptoms as any[], ['timestamp']) as any);
  s.setContexts(reviveDates(p.state.contexts as any[], ['timestamp', 'sleepStartTime', 'sleepEndTime']) as any);
  s.setExperiments(reviveDates(p.state.experiments as any[], ['startDate', 'endDate']) as any);
  s.setRealizations(reviveDates(p.state.realizations as any[], ['timestamp']) as any);
  s.setSources(reviveDates(p.state.sources as any[], ['addedAt']) as any);
  s.setRecipes(p.state.recipes as any);
  s.setFastingSettings(p.state.fastingSettings as any);
  s.setMacroGoals(p.state.macroGoals as any);
  s.setAutoScanSettings(p.state.autoScanSettings as any);
  s.setRecipeSourcesSettings(p.state.recipeSourcesSettings as any);
  s.setChatSession(p.state.chatSession as any);
}

// ─── Helpers: bytes <-> base64 (browser-safe, no deps) ─────────────────────
function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(s: string): ArrayBuffer {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iter = PBKDF2_ITER): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: iter, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBackup(payload: BackupPayload, passphrase: string): Promise<string> {
  if (!passphrase || passphrase.length < 6) throw new Error('Passphrase must be at least 6 characters');
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(JSON.stringify(payload)) as unknown as BufferSource
  );
  const env = {
    v: 1,
    app: 'digestive-diary',
    kdf: 'PBKDF2-SHA-256',
    iter: PBKDF2_ITER,
    cipher: 'AES-GCM',
    salt: b64encode(salt.buffer),
    iv: b64encode(iv.buffer),
    ciphertext: b64encode(ct),
  };
  return JSON.stringify(env, null, 2);
}

export async function decryptBackup(envelopeJson: string, passphrase: string): Promise<BackupPayload> {
  const env = JSON.parse(envelopeJson);
  if (env.app !== 'digestive-diary' || env.cipher !== 'AES-GCM') {
    throw new Error('Not a Digestive Diary encrypted backup');
  }
  const salt = new Uint8Array(b64decode(env.salt));
  const iv = new Uint8Array(b64decode(env.iv));
  const ct = b64decode(env.ciphertext);
  const key = await deriveKey(passphrase, salt, env.iter || PBKDF2_ITER);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ct
  );
  const json = new TextDecoder().decode(plain);
  return JSON.parse(json) as BackupPayload;
}

export function downloadFile(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
