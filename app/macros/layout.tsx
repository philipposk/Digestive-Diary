import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Macros', 'Macronutrients of the foods you have logged.', '/macros');

export default function MacrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
