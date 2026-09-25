import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('animate-pulse rounded-card', className)}
      style={{ background: 'var(--surface-alt)', ...style }}
      aria-hidden
    />
  );
}

export function SkeletonLines({ lines = 3, className }: Props) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${100 - i * 12}%` } as React.CSSProperties} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-1/3" />
      <SkeletonLines lines={2} />
    </div>
  );
}

export function SkeletonTimeline({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 px-5" aria-busy="true" aria-label="Loading timeline">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-4 w-12 flex-shrink-0" />
          <Skeleton className="h-12 flex-1" />
        </div>
      ))}
    </div>
  );
}
