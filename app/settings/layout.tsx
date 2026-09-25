import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Settings', 'Appearance, data export, account, and app preferences.');

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
