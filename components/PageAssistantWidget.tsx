'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  PageAssistant,
  supabaseChatHistoryAdapter,
  pageStateHint,
  DEFAULT_SCRUB_RULES,
  PLAIN_TEXT_SCRUB_RULES,
} from '@page-assistant/widget';
import { buildCapabilities } from '@/lib/page-assistant/capabilities';
import { PA_KNOWLEDGE } from '@/lib/page-assistant/knowledge';
import { getSupabaseClient, isCloudEnabled } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export default function PageAssistantWidget() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { user } = useAuth();
  const initialized = useRef(false);

  const caps = useMemo(() => buildCapabilities((href) => router.push(href)), [router]);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (initialized.current) {
      PageAssistant.destroy();
      initialized.current = false;
    }

    const sb = isCloudEnabled() ? getSupabaseClient() : null;

    PageAssistant.init({
      serverUrl: '/api/pa',
      appName: 'Digestive Diary',
      assistantName: 'Diary Guide',
      launcherIcon: 'chat',
      persona:
        'A calm, non-judgmental logging companion. Describe patterns in the user\'s data only — never diagnose, prescribe, or label foods good or bad.',
      knowledge: PA_KNOWLEDGE,
      knowledgeUrl: '/llm.txt',
      voice: true,
      settingsPageUrl: '/settings#assistant',
      capabilities: caps,
      suggestions: [
        'What patterns do you see in my logs?',
        'How do I log a symptom?',
        'What experiments am I running?',
      ],
      getPageState: () =>
        pageStateHint(
          { path: pathnameRef.current },
          `On ${pathnameRef.current}. Help with food/symptom/context logging, timeline, insights, or experiments — no medical advice.`,
        ),
      onNavigate: (href) => router.push(href),
      chatHistoryMode: sb && user ? 'account' : 'device',
      chatHistoryAdapter: sb
        ? supabaseChatHistoryAdapter(sb, { app: 'digestive-diary' })
        : undefined,
      chatHistoryFallbackMode: 'device',
      scrub: [...DEFAULT_SCRUB_RULES, ...PLAIN_TEXT_SCRUB_RULES],
      showModelPicker: 'auto',
    });

    initialized.current = true;

    return () => {
      PageAssistant.destroy();
      initialized.current = false;
    };
  }, [caps, user, router]);

  useEffect(() => {
    if (!initialized.current) return;
    PageAssistant.refreshChatHistory().catch((e) => console.warn('page-assistant history:', e));
  }, [user]);

  return null;
}
