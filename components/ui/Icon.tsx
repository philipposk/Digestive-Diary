// Line-icon set ported from /tmp/digestive-mockup/icons.jsx.
// Stroke inherits currentColor. Use `size` (px) + `stroke` (width) props.

import * as React from 'react';

interface IconProps {
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean;
}

function IconBase({
  size = 18,
  stroke = 1.6,
  className,
  style,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={rest['aria-hidden'] ?? true}
    >
      {children}
    </svg>
  );
}

export const IconBowl = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 12h18a8 8 0 0 1-16 0z" />
    <path d="M9 5c.8 1 .8 2 0 3M13 4c.8 1 .8 2 0 3" />
  </IconBase>
);
export const IconPulse = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 12h4l2-5 3 10 2-7 2 4h5" />
  </IconBase>
);
export const IconMoon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </IconBase>
);
export const IconCalendar = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </IconBase>
);
export const IconSpark = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </IconBase>
);
export const IconFlask = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 3h6M10 3v6.5L4.5 19A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-2L14 9.5V3" />
    <path d="M7.5 14h9" />
  </IconBase>
);
export const IconChat = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M21 12a8 8 0 0 1-12.5 6.6L4 20l1.3-4.4A8 8 0 1 1 21 12z" />
  </IconBase>
);
export const IconSearch = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconBase>
);
export const IconPlus = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);
export const IconChevR = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m9 6 6 6-6 6" />
  </IconBase>
);
export const IconChevL = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m15 6-6 6 6 6" />
  </IconBase>
);
export const IconChevD = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);
export const IconMore = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </IconBase>
);
export const IconUpRight = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </IconBase>
);
export const IconDownRight = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M7 7l10 10M17 9v8H9" />
  </IconBase>
);
export const IconCog = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </IconBase>
);
export const IconMic = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </IconBase>
);
export const IconCamera = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3 8h3l2-3h8l2 3h3v11H3z" />
    <circle cx="12" cy="13" r="3.5" />
  </IconBase>
);
export const IconClock = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);
export const IconClose = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </IconBase>
);
export const IconCheck = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m5 13 4 4L19 7" />
  </IconBase>
);
export const IconFilter = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </IconBase>
);
export const IconLink = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1" />
  </IconBase>
);
export const IconBook = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
    <path d="M4 4v15a2 2 0 0 0 2 2h14" />
  </IconBase>
);
export const IconTrash = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4h6v3" />
  </IconBase>
);

export const Dot = ({ size = 6, color = 'currentColor', className }: { size?: number; color?: string; className?: string }) => (
  <span
    className={className}
    style={{ display: 'inline-block', width: size, height: size, borderRadius: size, background: color, flexShrink: 0 }}
  />
);
