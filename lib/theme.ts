'use client';

import { VIBES, VibeId, DEFAULT_VIBE, DEFAULT_ACCENT, getVibe, getAccent, paletteVars } from './themeTokens';

export type Theme = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'normal' | 'large' | 'huge';

const KEY_THEME = 'theme';
const KEY_VIBE = 'theme-vibe';
const KEY_ACCENT = 'theme-accent';
const KEY_TEXT_SIZE = 'theme-text-size';
const KEY_DYSLEXIA = 'theme-dyslexia';
const KEY_HIGH_CONTRAST = 'theme-high-contrast';
const KEY_REDUCE_MOTION = 'theme-reduce-motion';

const TEXT_SIZE_PX: Record<TextSize, number> = {
  small: 14,
  normal: 16,
  large: 18,
  huge: 20,
};

export function getTextSize(): TextSize {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem(KEY_TEXT_SIZE) as TextSize | null) || 'normal';
}

export function setTextSize(s: TextSize) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_TEXT_SIZE, s);
  applyTheme();
}

export function getDyslexia(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_DYSLEXIA) === 'true';
}

export function setDyslexia(v: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DYSLEXIA, String(v));
  applyTheme();
}

export function getHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_HIGH_CONTRAST) === 'true';
}

export function setHighContrast(v: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_HIGH_CONTRAST, String(v));
  applyTheme();
}

export function getReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_REDUCE_MOTION) === 'true';
}

export function setReduceMotion(v: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_REDUCE_MOTION, String(v));
  applyTheme();
}

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

  // Accessibility toggles
  const size = getTextSize();
  root.style.setProperty('font-size', TEXT_SIZE_PX[size] + 'px');
  root.setAttribute('data-text-size', size);

  root.classList.toggle('dyslexia', getDyslexia());
  root.classList.toggle('high-contrast', getHighContrast());
  root.classList.toggle('reduce-motion', getReduceMotion());
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
