import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Timeline', 'Chronological view of your food, symptoms, and context logs.');

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
