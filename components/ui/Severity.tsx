interface Props {
  value: number;
  showValue?: boolean;
  className?: string;
}

/**
 * Pick a color per segment based on its tier:
 *   1-3  → green (mild)
 *   4-6  → amber (moderate)
 *   7-10 → red (severe)
 * Unfilled segments stay neutral.
 */
function colorFor(i: number): string {
  if (i <= 3) return '#5a8a3c';   // moss-green
  if (i <= 6) return '#c08a2c';   // amber
  return '#c44a4a';                // soft red
}

export default function Severity({ value, showValue = true, className = '' }: Props) {
  const safe = Math.max(0, Math.min(10, Math.round(value)));
  const segs = Array.from({ length: 10 }, (_, idx) => idx + 1);
  return (
    <div className={`inline-flex items-center gap-[2.5px] ${className}`}>
      {segs.map((i) => {
        const filled = i <= safe;
        return (
          <span
            key={i}
            style={{
              width: 7,
              height: 11,
              borderRadius: 1.5,
              background: filled ? colorFor(i) : 'var(--border)',
              opacity: filled ? 0.55 + i * 0.04 : 1,
            }}
          />
        );
      })}
      {showValue && (
        <span className="font-mono text-[11px] muted ml-2 tracking-mono">
          {safe}/10
        </span>
      )}
    </div>
  );
}

export function severityColor(value: number): string {
  return colorFor(Math.max(1, Math.min(10, Math.round(value))));
}
