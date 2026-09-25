'use client';

import { appendUtmParams } from '@/lib/utm';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  utmCampaign?: string;
}

export default function ExternalLink({
  href,
  utmCampaign = 'outbound',
  children,
  ...props
}: Props) {
  const url = appendUtmParams(href, utmCampaign);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
