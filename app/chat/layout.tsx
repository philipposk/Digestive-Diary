import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('Chat', 'Ask questions about your own logs. Not medical advice.', '/chat');

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
