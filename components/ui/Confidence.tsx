interface Props {
  level: 'low' | 'medium' | 'high';
  className?: string;
}

export default function Confidence({ level, className = '' }: Props) {
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 5,
            background: i < n ? 'var(--accent)' : 'var(--border)',
          }}
        />
      ))}
      <span className="font-mono text-[10.5px] muted uppercase ml-1.5 tracking-[0.08em]">
        {level}
      </span>
    </div>
  );
}
