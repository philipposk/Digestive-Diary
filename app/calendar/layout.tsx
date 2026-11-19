import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Calendar', 'Your food, symptom and context logs on a calendar.', '/calendar');

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
