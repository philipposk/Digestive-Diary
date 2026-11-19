import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Realizations', 'Patterns and realizations you have noted about your digestion.', '/realizations');

export default function RealizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
