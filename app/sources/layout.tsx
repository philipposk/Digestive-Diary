import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Sources', 'Keep your own library of books, articles and advice about digestion, with notes.', '/sources');

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
