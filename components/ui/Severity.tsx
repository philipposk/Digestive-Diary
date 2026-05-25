interface Props {
  value: number;
  showValue?: boolean;
  className?: string;
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
              background: filled ? 'var(--accent)' : 'var(--border)',
              opacity: filled ? 0.45 + i * 0.055 : 1,
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
