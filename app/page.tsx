import { pageMetadata, SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';
import HomeClient from './HomeClient';

export const metadata = pageMetadata(SITE_NAME, SITE_DESCRIPTION, '/');

export default function HomePage() {
  return <HomeClient />;
}
