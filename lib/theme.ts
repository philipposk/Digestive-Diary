'use client';

import { VIBES, VibeId, DEFAULT_VIBE, DEFAULT_ACCENT, getVibe, getAccent, paletteVars } from './themeTokens';

export type Theme = 'light' | 'dark' | 'system';

const KEY_THEME = 'theme';
const KEY_VIBE = 'theme-vibe';
const KEY_ACCENT = 'theme-accent';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(KEY_THEME) as Theme | null) || 'system';
}

export function getVibeId(): VibeId {
  if (typeof window === 'undefined') return DEFAULT_VIBE;
  const v = localStorage.getItem(KEY_VIBE);
  if (v && v in VIBES) return v as VibeId;
  return DEFAULT_VIBE;
}

export function getAccentHex(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  const a = localStorage.getItem(KEY_ACCENT);
  if (a) return a;
  return DEFAULT_ACCENT;
}

export function getEffectiveMode(): 'light' | 'dark' {
  const theme = getTheme();
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: Theme = getTheme()) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const mode: 'light' | 'dark' =
    theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-mode', mode);

  const vibe = getVibe(getVibeId());
  root.setAttribute('data-vibe', vibe.id);

  const accent = getAccent(vibe, getAccentHex());
  root.setAttribute('data-accent', accent.hex);

  const vars = paletteVars(vibe, mode, accent);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_THEME, theme);
  applyTheme(theme);
}

export function setVibe(id: VibeId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_VIBE, id);
  // Reset accent to first of new vibe if current accent doesn't belong.
  const vibe = VIBES[id];
  const a = getAccentHex();
  if (!vibe.accents.find((x) => x.hex === a)) {
    localStorage.setItem(KEY_ACCENT, vibe.accents[0].hex);
  }
  applyTheme();
}

export function setAccent(hex: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_ACCENT, hex);
  applyTheme();
}

if (typeof window !== 'undefined') {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
}
