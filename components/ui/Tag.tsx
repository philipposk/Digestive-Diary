import { Dot } from './Icon';

interface Props {
  children: React.ReactNode;
  dotColor?: string;
  className?: string;
}

export default function Tag({ children, dotColor, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[2.5px] rounded-full border border-app text-[11px] leading-[1.4] ink-soft ${className}`}
      style={{ letterSpacing: '0.01em' }}
    >
      {dotColor && <Dot size={5} color={dotColor} />}
      {children}
    </span>
  );
}
