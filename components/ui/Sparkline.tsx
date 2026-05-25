interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({ data, width = 120, height = 28, color, className }: Props) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const denom = Math.max(1, data.length - 1);
  const stepX = width / denom;
  const points = data.map((v, i) => [i * stepX, height - (v / max) * height] as const);
  const d = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
    .join(' ');
  const stroke = color || 'var(--accent)';
  return (
    <svg width={width} height={height} className={className} style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={data[i] === 0 ? 1 : 1.6}
          fill={data[i] === 0 ? 'var(--muted)' : stroke}
        />
      ))}
    </svg>
  );
}
