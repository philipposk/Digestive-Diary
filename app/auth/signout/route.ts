import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';

function originOf(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host');
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

async function endSession(request: NextRequest): Promise<NextResponse> {
  const origin = originOf(request);
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const target = new URL(next === '/' ? '/' : next, origin);
  const response = NextResponse.redirect(target, 303);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon && process.env.NEXT_PUBLIC_USE_CLOUD === 'true') {
    const cookieStore = cookies();
    const supabase = createServerClient(url, anon, {
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
    await supabase.auth.signOut({ scope: 'local' });
  }

  return response;
}

export async function POST(request: NextRequest) {
  return endSession(request);
}

export async function GET(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return new NextResponse('Not allowed', { status: 403 });
  }
  return endSession(request);
}
