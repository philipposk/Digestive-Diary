// Lightweight zero-dep i18n.
// Strings live in lib/i18n/messages-{locale}.ts. Locale stored in localStorage.
// Components call useT() to translate or t(key) outside React.
// ICU-lite: only {var} substitution + a simple plural via {count, plural, ...} not supported —
// callers just pass already-formatted strings for plurals.

'use client';

import { useEffect, useState } from 'react';
import { en } from './i18n/messages-en';
import { el } from './i18n/messages-el';

export type Locale = 'en' | 'el';
const STORAGE_KEY = 'i18n-locale';

const MESSAGES: Record<Locale, Record<string, string>> = { en, el };

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  el: 'Ελληνικά',
};

let currentLocale: Locale = 'en';
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && (stored === 'en' || stored === 'el')) currentLocale = stored;
  else {
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('el')) currentLocale = 'el';
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(l: Locale) {
  currentLocale = l;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.setAttribute('lang', l);
  }
  listeners.forEach((fn) => fn());
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = MESSAGES[currentLocale] || MESSAGES.en;
  const raw = dict[key] ?? MESSAGES.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function useT() {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { t, locale: currentLocale, setLocale };
}

export function useLocale() {
  const { locale, setLocale } = useT();
  return [locale, setLocale] as const;
}
