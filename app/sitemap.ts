import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/timeline',
    '/calendar',
    '/insights',
    '/realizations',
    '/experiments',
    '/recipes',
    '/sources',
    '/macros',
    '/factors',
    '/chat',
    '/settings',
    '/report',
    '/help',
    '/privacy',
    '/terms',
    '/login',
  ];

  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
