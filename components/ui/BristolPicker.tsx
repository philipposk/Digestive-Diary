// Bristol Stool Scale picker — 7 types per the medical literature.
// Used in LogContextModal when bowel movement = yes.
// Reference: https://en.wikipedia.org/wiki/Bristol_stool_scale

import { BristolType } from '@/types';

interface Props {
  value?: BristolType;
  onChange: (v: BristolType | undefined) => void;
}

const TYPES: Array<{ id: BristolType; label: string; hint: string }> = [
  { id: 1, label: 'Type 1', hint: 'Separate hard lumps' },
  { id: 2, label: 'Type 2', hint: 'Lumpy, sausage-shaped' },
  { id: 3, label: 'Type 3', hint: 'Sausage with cracks' },
  { id: 4, label: 'Type 4', hint: 'Smooth, soft sausage' },
  { id: 5, label: 'Type 5', hint: 'Soft blobs, clear edges' },
  { id: 6, label: 'Type 6', hint: 'Mushy, ragged edges' },
  { id: 7, label: 'Type 7', hint: 'Liquid, no solid' },
];

// Tiny inline SVG per type — abstract, non-graphic, illustrative shapes only.
function Glyph({ type }: { type: BristolType }) {
  const stroke = 'currentColor';
  switch (type) {
    case 1:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <circle cx="10" cy="14" r="3" />
          <circle cx="20" cy="20" r="3.5" />
          <circle cx="30" cy="14" r="3" />
          <circle cx="14" cy="28" r="2.5" />
          <circle cx="26" cy="28" r="2.5" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <path d="M6 20q4-6 8 0t8 0t8 0" />
          <path d="M6 20q4 6 8 0t8 0t8 0" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <rect x="5" y="14" width="30" height="12" rx="6" />
          <path d="M12 14v12M20 14v12M28 14v12" strokeDasharray="2 2" />
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <rect x="4" y="15" width="32" height="10" rx="5" />
        </svg>
      );
    case 5:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <ellipse cx="11" cy="20" rx="6" ry="4" />
          <ellipse cx="24" cy="20" rx="5" ry="3.5" />
          <ellipse cx="33" cy="20" rx="4" ry="3" />
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <path d="M5 22q3-8 7-2t6 0 6-3 5 4 5-1 1 4" />
          <path d="M5 22q3 8 7 2t6 0 6 3 5-4 5 1 1-4" />
        </svg>
      );
    case 7:
      return (
        <svg viewBox="0 0 40 40" width={40} height={40} fill="none" stroke={stroke} strokeWidth={1.5}>
          <path d="M4 16q4 0 8 4t8 0 8 4 8-4" />
          <path d="M4 24q4 0 8-4t8 0 8-4 8 4" strokeDasharray="3 2" />
        </svg>
      );
  }
}

export default function BristolPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {TYPES.map((t) => {
        const on = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(on ? undefined : t.id)}
            title={`${t.label}: ${t.hint}`}
            aria-label={`${t.label}: ${t.hint}`}
            className="flex flex-col items-center gap-1 py-1.5 rounded-card transition-colors"
            style={{
              background: on ? 'var(--accent)' : 'transparent',
              color: on ? 'var(--surface)' : 'var(--ink-soft)',
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <Glyph type={t.id} />
            <span className="font-mono text-[10px]" style={{ letterSpacing: '0.04em' }}>
              {t.id}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const BRISTOL_LABEL: Record<BristolType, string> = {
  1: 'Separate hard lumps',
  2: 'Lumpy sausage',
  3: 'Cracked sausage',
  4: 'Smooth sausage',
  5: 'Soft blobs',
  6: 'Mushy',
  7: 'Liquid',
};
