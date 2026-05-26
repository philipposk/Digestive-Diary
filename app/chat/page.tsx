'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture';
import { IconChevL, IconMic, IconMore, IconUpRight } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

function ChatPageContent() {
  const { t } = useT();
  const params = useSearchParams();
  const router = useRouter();
  const queryParam = params.get('query');

  const chatSession = useAppStore((s) => s.chatSession);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const clearChatSession = useAppStore((s) => s.clearChatSession);
  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const experiments = useAppStore((s) => s.experiments);
  const realizations = useAppStore((s) => s.realizations);
  const sources = useAppStore((s) => s.sources);

  const [input, setInput] = useState(queryParam || '');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceCapture();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages.length, loading]);

  useEffect(() => {
    if (queryParam && input && !chatSession?.messages.length) {
      const form = document.querySelector('form');
      form?.requestSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: msg });
    setLoading(true);
    try {
      const history = chatSession?.messages || [];
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userData: {
            foodLogs: foodLogs.slice(0, 50),
            symptoms: symptoms.slice(0, 50),
            experiments,
            realizations,
          },
          chatHistory: history.slice(-10),
          sources: sources.filter((s) => s.content).slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      addChatMessage({ role: 'assistant', content: data.response });
    } catch {
      addChatMessage({ role: 'assistant', content: t('chat.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleMic = async () => {
    if (voice.recording) {
      const transcript = await voice.stop();
      if (transcript) setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
    } else {
      await voice.start();
    }
  };

  const messages = chatSession?.messages ?? [];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 muted hover:text-ink text-[13px]"
        >
          <IconChevL size={16} /> {t('common.back')}
        </button>
        <div className="text-center">
          <div className="font-heading text-[16px] tracking-head ink">{t('chat.title')}</div>
          <div className="eyebrow">{t('chat.subtitle')}</div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="muted hover:text-ink"
            aria-label="More"
          >
            <IconMore size={18} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-20 card p-1 text-[13px] min-w-[140px]"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { clearChatSession(); setMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 hover:bg-surf-alt rounded-md ink-soft"
              >
                {t('chat.clear')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="card p-4">
            <div className="eyebrow mb-1">{t('chat.empty_title')}</div>
            <ul className="text-[13.5px] ink-soft space-y-1.5">
              <li>{t('chat.empty_1')}</li>
              <li>{t('chat.empty_2')}</li>
              <li>{t('chat.empty_3')}</li>
              <li>{t('chat.empty_4')}</li>
            </ul>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap"
                  style={
                    isUser
                      ? { background: 'var(--ink)', color: 'var(--bg)' }
                      : { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)' }
                  }
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="flex items-start">
            <div className="px-3.5 py-2.5 rounded-2xl text-[13px] muted" style={{ border: '1px solid var(--border)' }}>
              {t('chat.thinking')}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="sticky bottom-0 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}>
        <div className="card flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder')}
            disabled={loading}
            className="flex-1 bg-transparent border-0 outline-none text-[14px] ink"
          />
          {voice.supported && (
            <button
              type="button"
              onClick={handleMic}
              disabled={voice.transcribing}
              aria-label={voice.recording ? 'Stop recording' : 'Voice input'}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: voice.recording ? '#ef4444' : 'var(--surface-alt)',
                color: voice.recording ? '#fff' : 'var(--ink-soft)',
              }}
            >
              <IconMic size={15} />
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconUpRight size={15} />
          </button>
        </div>
        {voice.error && <p className="mt-1 text-[11px]" style={{ color: '#c44' }}>{voice.error}</p>}
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-2xl mx-auto px-5 py-6 muted">Loading…</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
