// Tap-to-drop SVG body-map picker for symptom location.
// Front + back outline. Stores markers as percent coords so they scale with size.

'use client';

import { useCallback, useRef, useState } from 'react';
import { SymptomLocation } from '@/types';

interface Props {
  value: SymptomLocation[];
  onChange: (next: SymptomLocation[]) => void;
}

const VB_W = 100;
const VB_H = 180;

// Front-facing human silhouette (viewBox 0 0 100 180)
const FRONT_PATH =
  'M50 6 a8 8 0 0 1 8 8 v6 a8 8 0 0 1 -16 0 v-6 a8 8 0 0 1 8 -8 z' +
  'M35 24 q15 -4 30 0 q3 10 0 22 l4 32 l-6 0 l-4 -22 l-2 30 l-2 50 l-6 0 l-3 -50 l-3 50 l-6 0 l-2 -50 l-2 -30 l-4 22 l-6 0 l4 -32 q-3 -12 0 -22 z';

// Back view — slightly wider shoulders
const BACK_PATH =
  'M50 6 a8 8 0 0 1 8 8 v6 a8 8 0 0 1 -16 0 v-6 a8 8 0 0 1 8 -8 z' +
  'M33 24 q17 -5 34 0 q3 10 0 22 l4 32 l-6 0 l-4 -22 l-2 30 l-2 50 l-6 0 l-3 -50 l-3 50 l-6 0 l-2 -50 l-2 -30 l-4 22 l-6 0 l4 -32 q-3 -12 0 -22 z';

function percentToSvg(x: number, y: number) {
  return { cx: (x / 100) * VB_W, cy: (y / 100) * VB_H };
}

function svgToPercent(svgX: number, svgY: number) {
  return {
    x: Math.max(0, Math.min(100, (svgX / VB_W) * 100)),
    y: Math.max(0, Math.min(100, (svgY / VB_H) * 100)),
  };
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  return pt.matrixTransform(ctm.inverse());
}

export default function BodyMapPicker({ value, onChange }: Props) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const svgRef = useRef<SVGSVGElement>(null);

  const placeMarker = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const svgPt = clientToSvg(svg, clientX, clientY);
      if (!svgPt) return;
      const { x, y } = svgToPercent(svgPt.x, svgPt.y);
      onChange([...value, { view, x, y }]);
    },
    [onChange, value, view],
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only place on the body background, not when removing an existing marker
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    placeMarker(e.clientX, e.clientY);
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
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          style={{ maxWidth: 200, height: 'auto', cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={view === 'front' ? FRONT_PATH : BACK_PATH}
            fill="var(--surface-alt)"
            stroke="var(--border-strong)"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          {view === 'back' && (
            <line
              x1={50}
              y1={30}
              x2={50}
              y2={78}
              stroke="var(--border-strong)"
              strokeWidth={0.5}
              opacity={0.5}
            />
          )}
          {markers.map((m, i) => {
            const originalIdx = value.findIndex((x) => x === m);
            const { cx, cy } = percentToSvg(m.x, m.y);
            return (
              <g
                key={`${view}-${originalIdx}-${i}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  removeMarker(originalIdx);
                }}
                style={{ cursor: 'pointer', touchAction: 'none' }}
              >
                <circle cx={cx} cy={cy} r={6} fill="var(--accent)" opacity={0.2} />
                <circle cx={cx} cy={cy} r={3.2} fill="var(--accent)" opacity={0.9} />
                <circle cx={cx} cy={cy} r={5.5} fill="none" stroke="var(--accent)" strokeWidth={0.7} opacity={0.55} />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-1.5 text-[11px] muted text-center">Tap to add · tap a marker to remove</p>

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
