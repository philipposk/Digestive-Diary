import { NextRequest, NextResponse } from 'next/server';
import { routerFromEnv, modelCatalog, synthesize, transcribe } from '@page-assistant/server';
import { guardApiRoute } from '@/lib/apiGuard';

export const runtime = 'nodejs';

const llm = routerFromEnv();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function guardSpend(req: NextRequest, bucket: string, capacity = 30) {
  return guardApiRoute(req, {
    bucket,
    capacity,
    refillPerMinute: capacity,
    requireAuth: false,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join('/');

  if (path === 'v1/health') {
    return NextResponse.json({ ok: true, service: 'page-assistant' });
  }

  if (path === 'v1/models') {
    return NextResponse.json(modelCatalog());
  }

  if (path === 'v1/voice/capabilities') {
    const providers: string[] = [];
    if (process.env.ELEVENLABS_API_KEY) providers.push('elevenlabs');
    if (process.env.OPENAI_API_KEY) providers.push('openai');
    return NextResponse.json({
      tts: { server: providers.length > 0, providers },
      stt: { server: !!process.env.OPENAI_API_KEY },
    });
  }

  return jsonError('Not found', 404);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join('/');

  if (path === 'v1/llm/complete') {
    const blocked = await guardSpend(request, 'pa-llm');
    if (blocked) return blocked;

    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return jsonError('No LLM API key configured on server', 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    const { model, messages, tools, ...rest } = body;
    if (!Array.isArray(messages)) {
      return jsonError('`messages` must be an array', 400);
    }
    if (tools !== undefined && !Array.isArray(tools)) {
      return jsonError('`tools` must be an array when provided', 400);
    }

    try {
      const out = await llm.complete({
        ...(rest as Record<string, unknown>),
        model: typeof model === 'string' ? model : undefined,
        messages,
        tools: Array.isArray(tools) ? tools : [],
      } as Parameters<typeof llm.complete>[0]);
      return NextResponse.json(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'LLM request failed';
      console.error('[pa/llm/complete]', msg);
      return jsonError('The upstream AI provider is unavailable right now. Please try again shortly.', 502);
    }
  }

  if (path === 'v1/voice/tts') {
    const blocked = await guardSpend(request, 'pa-voice', 20);
    if (blocked) return blocked;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    const text = body.text;
    if (typeof text !== 'string' || !text.trim()) {
      return jsonError('text required', 400);
    }
    if (text.length > 2000) {
      return jsonError('text too long (max 2000 chars)', 400);
    }

    try {
      const { audio, contentType } = await synthesize({
        text,
        voiceId: typeof body.voiceId === 'string' ? body.voiceId : undefined,
        provider: body.provider === 'elevenlabs' || body.provider === 'openai' ? body.provider : undefined,
        lang: typeof body.lang === 'string' ? body.lang : undefined,
      });
      return new NextResponse(new Uint8Array(audio), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        },
      });
    } catch (e) {
      console.error('[pa/voice/tts]', e);
      return jsonError('Voice synthesis failed', 502);
    }
  }

  if (path === 'v1/voice/stt') {
    const blocked = await guardSpend(request, 'pa-voice', 20);
    if (blocked) return blocked;

    if (!process.env.OPENAI_API_KEY) {
      return jsonError('Speech transcription not configured', 500);
    }

    const buf = Buffer.from(await request.arrayBuffer());
    if (buf.length === 0) return jsonError('No audio provided', 400);
    if (buf.length > 5_000_000) return jsonError('Audio too large', 413);

    const contentType = request.headers.get('content-type') ?? undefined;
    const lang = request.headers.get('x-voice-lang') ?? undefined;

    try {
      const text = await transcribe(buf, { hint: contentType, lang: lang ?? undefined });
      return NextResponse.json({ text });
    } catch (e) {
      console.error('[pa/voice/stt]', e);
      return jsonError('Speech transcription failed', 502);
    }
  }

  return jsonError('Not found', 404);
}
