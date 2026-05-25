import * as React from 'react';

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ eyebrow, title, subtitle, action, className = '' }: Props) {
  return (
    <header className={`px-5 pt-3.5 pb-4 flex flex-col gap-1 ${className}`}>
      {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="m-0 font-heading text-[34px] leading-[1.05] tracking-head text-ink">
          {title}
        </h1>
        {action}
      </div>
      {subtitle && <p className="muted text-[13.5px] mt-0.5">{subtitle}</p>}
    </header>
  );
}
