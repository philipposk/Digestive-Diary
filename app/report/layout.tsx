import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Report', 'A summary of your logs to share with your doctor or dietitian.', '/report');

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
