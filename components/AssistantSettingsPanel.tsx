'use client';

import { useEffect, useRef } from 'react';
import { mountAssistantSettingsPanel } from '@page-assistant/widget';

export default function AssistantSettingsPanel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    mountAssistantSettingsPanel(el);
  }, []);

  return <div ref={ref} id="assistant" className="scroll-mt-24" />;
}
