import type { Metadata } from 'next';

export const SITE_NAME = 'Digestive Diary';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://digestive.6x7.gr';
export const SITE_DESCRIPTION =
  'A non-judgmental tracking app for digestive disorders. Log food, symptoms, and patterns — not medical advice.';

export function pageMetadata(title: string, description?: string, path?: string): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
  const desc = description ?? SITE_DESCRIPTION;

  return {
    // The root layout's title template adds " · Digestive Diary"; pass the bare title so it appears once.
    title: title === SITE_NAME ? { absolute: SITE_NAME } : title,
    description: desc,
    alternates: { canonical: path !== undefined ? `${SITE_URL}${path}` : canonicalPath(title) },
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
