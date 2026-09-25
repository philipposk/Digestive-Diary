import type { Metadata } from 'next';

export const SITE_NAME = 'Digestive Diary';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://digestive-diary-filippos-projects-06f05211.vercel.app';
export const SITE_DESCRIPTION =
  'A non-judgmental tracking app for digestive disorders. Log food, symptoms, and patterns — not medical advice.';

export function pageMetadata(title: string, description?: string): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
  const desc = description ?? SITE_DESCRIPTION;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: canonicalPath(title) },
    openGraph: {
      title: fullTitle,
      description: desc,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
    },
  };
}

const TITLE_PATHS: Record<string, string> = {
  Today: '/',
  Timeline: '/timeline',
  Calendar: '/calendar',
  Insights: '/insights',
  Experiments: '/experiments',
  Settings: '/settings',
  Chat: '/chat',
  Help: '/help',
  Login: '/login',
  Privacy: '/privacy',
  Terms: '/terms',
};

function canonicalPath(title: string): string {
  const path = TITLE_PATHS[title] ?? '/';
  return `${SITE_URL}${path}`;
}

export const APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};
