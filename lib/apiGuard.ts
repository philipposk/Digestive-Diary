import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, type RateLimitOptions } from './rateLimit';
import type { Validator } from './validation';

interface GuardResult<T> {
  ok: true;
  data: T;
}
interface GuardError {
  ok: false;
  response: NextResponse;
}

export async function guard<T>(
  request: NextRequest,
  schema: Validator<T>,
  rl: RateLimitOptions
): Promise<GuardResult<T> | GuardError> {
  const limit = rateLimit(request, rl);
  if (!limit.ok) {
    const res = NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
    if (limit.retryAfterSec) res.headers.set('Retry-After', String(limit.retryAfterSec));
    return { ok: false, response: res };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }) };
  }

  const parsed = schema(body);
  if (!parsed.ok) {
    return { ok: false, response: NextResponse.json({ error: `validation failed: ${parsed.error}` }, { status: 400 }) };
  }

  return { ok: true, data: parsed.value as T };
}

export function safeJsonParse<T = any>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
