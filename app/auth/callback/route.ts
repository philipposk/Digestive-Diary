import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { LOGIN_PATH } from '@/lib/auth/constants';
import { explainAuthError } from '@/lib/auth-error';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';

const OTP_TYPES: readonly EmailOtpType[] = [
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
  'email',
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

function originOf(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host');
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

function backToLogin(origin: string, next: string, message: string): NextResponse {
  const url = new URL(LOGIN_PATH, origin);
  url.searchParams.set('error', message);
  if (next !== '/') url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

function createRouteClient(response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(cacheHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = originOf(request);
  const next = safeNext(params.get('next'));

  if (process.env.NEXT_PUBLIC_USE_CLOUD !== 'true') {
    return backToLogin(origin, next, explainAuthError({ message: 'Cloud sign-in is not enabled.' }));
  }

  const providerError = params.get('error_description') ?? params.get('error');
  if (providerError) return backToLogin(origin, next, providerError);

  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  const redirectUrl = `${origin}${next}`;
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteClient(response);

  if (!supabase) {
    return backToLogin(origin, next, explainAuthError({ message: 'Supabase is not configured.' }));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return backToLogin(origin, next, explainAuthError(error));
    return response;
  }

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return backToLogin(origin, next, explainAuthError(error));
    return response;
  }

  return backToLogin(
    origin,
    next,
    'This sign-in link is incomplete. Request a new one from the login page.'
  );
}
