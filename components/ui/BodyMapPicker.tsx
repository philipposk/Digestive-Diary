// Tap-to-drop SVG body-map picker for symptom location.
// Front + back outline. Stores markers as percent coords so they scale with width.

'use client';

import { useRef, useState } from 'react';
import { SymptomLocation } from '@/types';

interface Props {
  value: SymptomLocation[];
  onChange: (next: SymptomLocation[]) => void;
}

// Minimal humanoid outlines — front + back. Path coordinates target a 100x180 viewBox.
const FRONT_PATH =
  'M50 6 a8 8 0 0 1 8 8 v6 a8 8 0 0 1 -16 0 v-6 a8 8 0 0 1 8 -8 z' +
  'M35 24 q15 -4 30 0 q3 10 0 22 l4 32 l-6 0 l-4 -22 l-2 30 l-2 50 l-6 0 l-3 -50 l-3 50 l-6 0 l-2 -50 l-2 -30 l-4 22 l-6 0 l4 -32 q-3 -12 0 -22 z';

const BACK_PATH = FRONT_PATH; // same silhouette; user just rotates 180° mentally

export default function BodyMapPicker({ value, onChange }: Props) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange([...value, { view, x, y }]);
  };

  const removeMarker = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const markers = value.filter((m) => m.view === view);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="eyebrow">Tap where it hurts</div>
        <div className="flex gap-1">
          {(['front', 'back'] as const).map((v) => {
            const on = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="px-2.5 py-1 rounded-full text-[11px] capitalize"
                style={{
                  background: on ? 'var(--ink)' : 'transparent',
                  color: on ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 100 180"
          width="140"
          height="252"
          onClick={handleClick}
          style={{ cursor: 'crosshair' }}
        >
          <path
            d={view === 'front' ? FRONT_PATH : BACK_PATH}
            fill="var(--surface-alt)"
            stroke="var(--border-strong)"
            strokeWidth={0.8}
          />
          {markers.map((m, i) => {
            // value array index might differ from filtered; find original index
            const originalIdx = value.findIndex((x) => x === m);
            return (
              <g
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  removeMarker(originalIdx);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={m.x} cy={m.y} r={2.6} fill="var(--accent)" opacity={0.85} />
                <circle cx={m.x} cy={m.y} r={4.5} fill="none" stroke="var(--accent)" strokeWidth={0.6} opacity={0.5} />
              </g>
            );
          })}
        </svg>
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-[11.5px] muted">
          <span>{value.length} marker{value.length === 1 ? '' : 's'}</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
