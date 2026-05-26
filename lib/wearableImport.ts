// Wearable / health-app CSV import.
// Goal: parse vendor-flavored CSVs (Apple Health XML→CSV exports, Fitbit takeout, Garmin Connect)
// and merge into the context-log stream as sleep / activity / hydration entries.
// We bias toward "good enough" parsing — vendors change column names, so we accept many aliases.

import { Context } from '@/types';

export interface ImportPreview {
  rows: number;
  sleepEntries: Omit<Context, 'id'>[];
  errors: string[];
}

/** Naive CSV parser. Handles quoted fields with commas + escaped quotes ""; no streaming. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cell += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}

const SLEEP_HEADER_HINTS = ['sleep', 'asleep', 'in bed', 'inbed'];
const QUALITY_HINTS = ['quality', 'efficiency', 'score'];
const DURATION_HINTS = ['duration', 'asleep', 'minutes asleep', 'hours asleep', 'in bed minutes'];
const START_HINTS = ['start', 'startdate', 'start_date', 'bed time', 'bedtime'];
const END_HINTS = ['end', 'enddate', 'end_date', 'wake', 'waketime'];
const DATE_HINTS = ['date', 'day', 'recorded'];

function lc(s: string) { return (s || '').toLowerCase().trim(); }

function colIndex(header: string[], hints: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = lc(header[i]);
    if (hints.some((hint) => h.includes(hint))) return i;
  }
  return -1;
}

function safeDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Apple Health is "yyyy-MM-dd HH:mm:ss +ZZZZ" — Date constructor handles that.
  // Fitbit can use "M/d/yyyy". Try parsing manually.
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})?/);
  if (m) {
    const [, mo, dd, yy, hh = '0', mm = '0'] = m;
    const dt = new Date(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mm));
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

function durationToHours(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isNaN(n)) {
    // Heuristic: >24 means minutes (e.g. 420 min); >1440 means seconds.
    if (n > 1440) return n / 3600;
    if (n > 24) return n / 60;
    return n;
  }
  // "7h 32m" form
  const m = value.match(/(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?/i);
  if (m) {
    const h = Number(m[1]);
    const mm = m[2] ? Number(m[2]) / 60 : 0;
    return h + mm;
  }
  return undefined;
}

function qualityFromScore(value: string): Context['sleepQuality'] | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isNaN(n)) {
    // 0-100 (Fitbit), or 0-10 quality rating
    if (n > 80 || (n <= 10 && n >= 8)) return 'good';
    if (n >= 60 || (n <= 7 && n >= 4)) return 'ok';
    return 'poor';
  }
  const lcv = lc(value);
  if (lcv.includes('good') || lcv.includes('great') || lcv.includes('excellent')) return 'good';
  if (lcv.includes('fair') || lcv.includes('ok') || lcv.includes('average')) return 'ok';
  if (lcv.includes('poor') || lcv.includes('bad') || lcv.includes('restless')) return 'poor';
  return undefined;
}

/**
 * Parse a CSV string and pick out sleep rows. Vendor-agnostic — we look for
 * recognisable columns and silently skip rows we can't make sense of.
 */
export function importSleepCSV(text: string): ImportPreview {
  const rows = parseCSV(text);
  if (rows.length < 2) return { rows: 0, sleepEntries: [], errors: ['CSV is empty'] };

  const header = rows[0];
  const dataRows = rows.slice(1);
  const errors: string[] = [];

  const dateIdx = colIndex(header, DATE_HINTS);
  const startIdx = colIndex(header, START_HINTS);
  const endIdx = colIndex(header, END_HINTS);
  const durationIdx = colIndex(header, DURATION_HINTS);
  const qualityIdx = colIndex(header, QUALITY_HINTS);
  // Bias the heuristic: if no clear sleep column is present, also abort
  const looksLikeSleep =
    header.some((h) => SLEEP_HEADER_HINTS.some((hint) => lc(h).includes(hint))) ||
    durationIdx >= 0 ||
    (startIdx >= 0 && endIdx >= 0);

  if (!looksLikeSleep) {
    return { rows: dataRows.length, sleepEntries: [], errors: ['No sleep-like columns detected.'] };
  }

  const out: Omit<Context, 'id'>[] = [];
  dataRows.forEach((r, rowIdx) => {
    try {
      let start: Date | null = null;
      let end: Date | null = null;
      if (startIdx >= 0) start = safeDate(r[startIdx]);
      if (endIdx >= 0) end = safeDate(r[endIdx]);
      let duration: number | undefined;
      if (durationIdx >= 0) duration = durationToHours(r[durationIdx]);
      if (start && end && duration === undefined) {
        duration = (end.getTime() - start.getTime()) / 3.6e6;
      }
      const dateOnly = dateIdx >= 0 ? safeDate(r[dateIdx]) : null;
      const ts = end || start || dateOnly;
      if (!ts) return; // skip — no usable timestamp
      const quality = qualityIdx >= 0 ? qualityFromScore(r[qualityIdx]) : undefined;
      if (duration === undefined && !quality) return; // nothing usable
      out.push({
        timestamp: ts,
        sleepDuration: duration,
        sleepStartTime: start || undefined,
        sleepEndTime: end || undefined,
        sleepQuality: quality,
        notes: 'imported',
      });
    } catch (err: any) {
      errors.push(`Row ${rowIdx + 2}: ${err?.message || 'parse failed'}`);
    }
  });

  return { rows: dataRows.length, sleepEntries: out, errors };
}
