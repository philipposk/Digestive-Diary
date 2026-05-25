// Design tokens ported from /tmp/digestive-mockup. Three vibes × dark/light × accent.
// Hardcoded fonts (geometric sans), density (regular), card style (bordered) for now.
// Vibe + accent + dark exposed in /settings; everything else stays canonical.

export type VibeId = 'clinical' | 'editorial' | 'warm';
export type ModeId = 'light' | 'dark';
export type CardStyle = 'bordered' | 'filled' | 'flat';
export type Density = 'compact' | 'regular' | 'cozy';

export interface Palette {
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
}

export interface Accent {
  name: string;
  hex: string;
  soft: string;
}

export interface Vibe {
  id: VibeId;
  label: string;
  light: Palette;
  dark: Palette;
  accents: Accent[];
}

export const VIBES: Record<VibeId, Vibe> = {
  clinical: {
    id: 'clinical',
    label: 'Quiet & Clinical',
    light: {
      bg:           '#f6f5f1',
      bgDeep:       '#ecebe5',
      surface:      '#ffffff',
      surfaceAlt:   '#f0efe9',
      border:       'rgba(20,20,15,0.09)',
      borderStrong: 'rgba(20,20,15,0.16)',
      ink:          '#16161a',
      inkSoft:      '#3a3a36',
      muted:        '#7a7770',
      faint:        '#a8a59c',
    },
    dark: {
      bg:           '#101010',
      bgDeep:       '#070707',
      surface:      '#1a1a1a',
      surfaceAlt:   '#222220',
      border:       'rgba(255,255,250,0.10)',
      borderStrong: 'rgba(255,255,250,0.20)',
      ink:          '#f0eee8',
      inkSoft:      '#cfccc4',
      muted:        '#8a877f',
      faint:        '#5c594f',
    },
    accents: [
      { name: 'Moss',       hex: '#3f5a3c', soft: '#e6ebd9' },
      { name: 'Ink Blue',   hex: '#1f3a8a', soft: '#dbe2f0' },
      { name: 'Terracotta', hex: '#a8462f', soft: '#f1dcd2' },
      { name: 'Plum',       hex: '#5b3a5b', soft: '#e8dbe8' },
    ],
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial Diary',
    light: {
      bg:           '#f1ece1',
      bgDeep:       '#e6e0d2',
      surface:      '#fbf7ec',
      surfaceAlt:   '#ede7d8',
      border:       'rgba(60,40,15,0.12)',
      borderStrong: 'rgba(60,40,15,0.22)',
      ink:          '#2a2520',
      inkSoft:      '#534a3e',
      muted:        '#8a7e6c',
      faint:        '#b8ad99',
    },
    dark: {
      bg:           '#191613',
      bgDeep:       '#100e0c',
      surface:      '#23201b',
      surfaceAlt:   '#2c2922',
      border:       'rgba(245,235,210,0.10)',
      borderStrong: 'rgba(245,235,210,0.20)',
      ink:          '#f0ebe0',
      inkSoft:      '#d0c9b8',
      muted:        '#8d8472',
      faint:        '#5a5448',
    },
    accents: [
      { name: 'Burnt Orange', hex: '#b85728', soft: '#f0d9c8' },
      { name: 'Forest',       hex: '#34543d', soft: '#d6e2d2' },
      { name: 'Ink',          hex: '#1d2b4a', soft: '#d3d8e2' },
      { name: 'Aubergine',    hex: '#6e3850', soft: '#e8d4dd' },
    ],
  },
  warm: {
    id: 'warm',
    label: 'Warm & Organic',
    light: {
      bg:           '#ece4d4',
      bgDeep:       '#ddd2bd',
      surface:      '#f6efde',
      surfaceAlt:   '#e5dbc4',
      border:       'rgba(80,50,20,0.14)',
      borderStrong: 'rgba(80,50,20,0.26)',
      ink:          '#2a1f14',
      inkSoft:      '#52432f',
      muted:        '#8c7a60',
      faint:        '#b5a48a',
    },
    dark: {
      bg:           '#1d1610',
      bgDeep:       '#120d09',
      surface:      '#2a2118',
      surfaceAlt:   '#352a1e',
      border:       'rgba(240,220,180,0.10)',
      borderStrong: 'rgba(240,220,180,0.20)',
      ink:          '#f0e6d0',
      inkSoft:      '#d0c2a4',
      muted:        '#8d7d62',
      faint:        '#5a4f3e',
    },
    accents: [
      { name: 'Clay',     hex: '#b85932', soft: '#efd4c4' },
      { name: 'Olive',    hex: '#5a6428', soft: '#dde0c4' },
      { name: 'Cobalt',   hex: '#2a4870', soft: '#d2dbe6' },
      { name: 'Mulberry', hex: '#7a3a48', soft: '#ecd2d8' },
    ],
  },
};

export const DEFAULT_VIBE: VibeId = 'clinical';
export const DEFAULT_ACCENT = '#3f5a3c';

export function getVibe(id: string | undefined | null): Vibe {
  return (id && (VIBES as Record<string, Vibe>)[id]) || VIBES[DEFAULT_VIBE];
}

export function getAccent(vibe: Vibe, hex: string | undefined | null): Accent {
  return vibe.accents.find((a) => a.hex === hex) || vibe.accents[0];
}

export function paletteFor(vibe: Vibe, mode: ModeId): Palette {
  return mode === 'dark' ? vibe.dark : vibe.light;
}

// Emit CSS-custom-property assignments for a given (vibe, mode, accent).
// Used by the theme provider to set them on <html> at runtime.
export function paletteVars(vibe: Vibe, mode: ModeId, accent: Accent): Record<string, string> {
  const p = paletteFor(vibe, mode);
  return {
    '--bg': p.bg,
    '--bg-deep': p.bgDeep,
    '--surface': p.surface,
    '--surface-alt': p.surfaceAlt,
    '--border': p.border,
    '--border-strong': p.borderStrong,
    '--ink': p.ink,
    '--ink-soft': p.inkSoft,
    '--muted': p.muted,
    '--faint': p.faint,
    '--accent': accent.hex,
    '--accent-soft': accent.soft,
  };
}
