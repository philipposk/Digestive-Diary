import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, type RateLimitOptions } from './rateLimit';
import { createSupabaseServerClient } from './supabase/server';
import type { Validator } from './validation';

const SITE_HOSTS = new Set([
  'digestive.6x7.gr',
  'digestive-diary.vercel.app',
  'localhost:3000',
  '127.0.0.1:3000',
]);

interface GuardResult<T> {
  ok: true;
  data: T;
}
interface GuardError {
  ok: false;
  response: NextResponse;
}

/** Require a signed-in Supabase user (Google OAuth session cookie). */
export async function requireAuth(): Promise<NextResponse | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  }
  return null;
}

/** Reject obvious cross-site API abuse (browser sends Origin on fetch). */
export function checkApiOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  try {
    const host = new URL(origin).host;
    if (!SITE_HOSTS.has(host) && !host.endsWith('.vercel.app')) {
      return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'invalid origin' }, { status: 403 });
  }
  return null;
}

export async function guardApiRoute(
  req: NextRequest,
  opts: RateLimitOptions & { checkOrigin?: boolean; requireAuth?: boolean }
): Promise<NextResponse | null> {
  if (opts.requireAuth) {
    const authBlock = await requireAuth();
    if (authBlock) return authBlock;
  }
  if (opts.checkOrigin !== false) {
    const originBlock = checkApiOrigin(req);
    if (originBlock) return originBlock;
  }
  const limit = rateLimit(req, opts);
  if (!limit.ok) {
    const res = NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
    if (limit.retryAfterSec) res.headers.set('Retry-After', String(limit.retryAfterSec));
    return res;
  }
  return null;
}

export async function guard<T>(
  request: NextRequest,
  schema: Validator<T>,
  rl: RateLimitOptions & { checkOrigin?: boolean; requireAuth?: boolean }
): Promise<GuardResult<T> | GuardError> {
  const blocked = await guardApiRoute(request, rl);
  if (blocked) return { ok: false, response: blocked };

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

export function safeJsonParse<T = unknown>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
