import { generateLlmTxt } from '@page-assistant/core';
import { PA_KNOWLEDGE, PA_LLM_META } from '@/lib/page-assistant/knowledge';
import { buildCapabilities } from '@/lib/page-assistant/capabilities';

export const runtime = 'nodejs';

export async function GET() {
  const caps = buildCapabilities(() => {});
  const body = generateLlmTxt(
    {
      ...PA_LLM_META,
      description: `${PA_LLM_META.description}\n\n${PA_KNOWLEDGE}`,
    },
    caps,
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
