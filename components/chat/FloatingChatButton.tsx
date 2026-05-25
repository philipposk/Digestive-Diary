'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { IconChat } from '@/components/ui/Icon';

export default function FloatingChatButton() {
  const router = useRouter();
  const chatSession = useAppStore((state) => state.chatSession);
  const hasMessages = !!chatSession && chatSession.messages.length > 0;

  return (
    <button
      onClick={() => router.push('/chat')}
      aria-label="Ask the diary"
      className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
      style={{
        background: 'var(--ink)',
        color: 'var(--bg)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
      }}
    >
      <IconChat size={20} stroke={1.6} />
      {hasMessages && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ background: 'var(--accent)', border: '2px solid var(--bg)' }}
        />
      )}
    </button>
  );
}
