import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Sources', 'The research and guidelines Digestive Diary draws on, with links.', '/sources');

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
