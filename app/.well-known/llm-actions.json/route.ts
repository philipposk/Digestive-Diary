import { generateActionsJson } from '@page-assistant/core';
import { PA_LLM_META } from '@/lib/page-assistant/knowledge';
import { buildCapabilities } from '@/lib/page-assistant/capabilities';

export const runtime = 'nodejs';

export async function GET() {
  const caps = buildCapabilities(() => {});
  const body = generateActionsJson(PA_LLM_META, caps);

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
