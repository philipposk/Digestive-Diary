import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Factors', 'Sleep, stress and other context factors alongside your symptoms.', '/factors');

export default function FactorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
