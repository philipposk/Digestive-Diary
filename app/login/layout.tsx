import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Login', 'Sign in with Google to sync your diary across devices.');

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
