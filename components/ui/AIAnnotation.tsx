import { IconSpark } from './Icon';

interface Props {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export default function AIAnnotation({ label = 'Pattern', children, className = '' }: Props) {
  return (
    <div className={`flex gap-2.5 items-start px-3.5 py-2.5 border-t border-b border-app bg-surf-alt ${className}`}>
      <div
        className="w-[18px] h-[18px] mt-0.5 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent)', color: 'var(--surface)' }}
      >
        <IconSpark size={11} stroke={2.2} />
      </div>
      <div className="flex-1 text-[13px] leading-[1.5] ink-soft">
        <div className="eyebrow mb-0.5">{label}</div>
        {children}
      </div>
    </div>
  );
}
