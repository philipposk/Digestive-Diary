import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Insights', 'Patterns from your logged data. Not medical advice.');

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
