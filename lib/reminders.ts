'use client';

import { useAppStore } from './store';

const KEY_REMINDERS = 'reminders-settings';
const KEY_LAST_FIRE = 'reminders-last-fire';

export interface ReminderSettings {
  enabled: boolean;
  postMealMinutes: number;     // minutes after most recent food log to nudge
  eveningSummaryHour: number;  // 0-23, 0 disables
}

const DEFAULTS: ReminderSettings = {
  enabled: false,
  postMealMinutes: 120,
  eveningSummaryHour: 21,
};

export function getReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY_REMINDERS);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch { return DEFAULTS; }
}

export function setReminderSettings(s: ReminderSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_REMINDERS, JSON.stringify(s));
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
}

function getLastFire(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY_LAST_FIRE) || '{}');
  } catch { return {}; }
}
function setLastFire(map: Record<string, number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_LAST_FIRE, JSON.stringify(map));
}

function fire(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      tag,
      icon: '/icon.svg',
      badge: '/icon.svg',
    });
  } catch { /* SW path falls back silently */ }
}

const HOUR = 60 * 60 * 1000;

/** Called by a setInterval(5min) tick in components/RemindersRunner. */
export function tickReminders() {
  if (typeof window === 'undefined') return;
  const settings = getReminderSettings();
  if (!settings.enabled) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const last = getLastFire();
  const now = Date.now();

  // Post-meal nudge.
  if (settings.postMealMinutes > 0) {
    const foodLogs = useAppStore.getState().foodLogs;
    const symptoms = useAppStore.getState().symptoms;
    const latestFood = foodLogs[0];
    if (latestFood) {
      const ts = (latestFood.timestamp instanceof Date ? latestFood.timestamp : new Date(latestFood.timestamp)).getTime();
      const wait = settings.postMealMinutes * 60 * 1000;
      const dueAt = ts + wait;
      if (now >= dueAt && now - dueAt < HOUR) {
        const lastForThisMeal = last[`postmeal:${latestFood.id}`] ?? 0;
        // Suppress if user already logged a symptom or another food after this meal.
        const newerSymptom = symptoms.find((s) => {
          const t = (s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp)).getTime();
          return t > ts;
        });
        const newerFood = foodLogs.slice(1).find((f) => {
          const t = (f.timestamp instanceof Date ? f.timestamp : new Date(f.timestamp)).getTime();
          return t > ts;
        });
        if (!lastForThisMeal && !newerSymptom && !newerFood) {
          fire('How are you feeling?', `It’s been ${Math.round(settings.postMealMinutes / 60 * 10) / 10}h since you logged ${latestFood.food}. Tap to log how you feel.`, `postmeal:${latestFood.id}`);
          last[`postmeal:${latestFood.id}`] = now;
        }
      }
    }
  }

  // Evening summary.
  if (settings.eveningSummaryHour > 0) {
    const d = new Date();
    const hour = d.getHours();
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const tagKey = `evening:${dayKey}`;
    if (hour >= settings.eveningSummaryHour && !last[tagKey]) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const meals = useAppStore.getState().foodLogs.filter((f) => {
        const t = (f.timestamp instanceof Date ? f.timestamp : new Date(f.timestamp)).getTime();
        return t >= todayStart.getTime();
      }).length;
      const sym = useAppStore.getState().symptoms.filter((s) => {
        const t = (s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp)).getTime();
        return t >= todayStart.getTime();
      }).length;
      fire('Today, in a sentence', `${meals} meals · ${sym} symptoms logged. Anything else worth noting before bed?`, tagKey);
      last[tagKey] = now;
    }
  }

  // Drop old keys to keep localStorage tidy.
  const fresh: Record<string, number> = {};
  for (const k in last) {
    if (now - last[k] < 14 * 24 * HOUR) fresh[k] = last[k];
  }
  setLastFire(fresh);
}
