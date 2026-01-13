'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function FloatingChatButton() {
  const router = useRouter();
  const chatSession = useAppStore((state) => state.chatSession);
  const hasUnread = chatSession && chatSession.messages.length > 0;

  const handleClick = () => {
    router.push('/chat');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
      aria-label="Open AI Chat"
    >
      🤖
      {hasUnread && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </button>
  );
}

