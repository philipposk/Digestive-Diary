import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Experiments', 'Run simple elimination and reintroduction experiments and track the results.', '/experiments');

export default function ExperimentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
