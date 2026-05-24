// Server-side Supabase client. Scaffold only — guarded behind NEXT_PUBLIC_USE_CLOUD.
//
// For Route Handlers / Server Components, prefer the @supabase/ssr helpers.
// This wrapper centralizes the env-var check and dynamic-import gate so that the
// codebase compiles cleanly without the package installed.

type SupabaseLike = {
  auth: unknown;
  from: (table: string) => unknown;
};

export function isCloudEnabledServer(): boolean {
  return process.env.NEXT_PUBLIC_USE_CLOUD === 'true';
}

export function getServiceRoleClient(): SupabaseLike | null {
  if (!isCloudEnabledServer()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseLike;
  } catch {
    console.warn('Supabase enabled but @supabase/supabase-js not installed.');
    return null;
  }
}

// SSR cookie-bound client (Route Handlers, Server Components, etc.).
// Once @supabase/ssr is installed, replace the body with createServerClient(...) from that package.
export function getServerSupabaseClient(_cookieStore?: unknown): SupabaseLike | null {
  if (!isCloudEnabledServer()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createServerClient } = require('@supabase/ssr');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createServerClient(url, anon, {
      cookies: {
        get() { return undefined; },
        set() { /* no-op until ssr cookie store wired */ },
        remove() { /* no-op */ },
      },
    }) as SupabaseLike;
  } catch {
    console.warn('@supabase/ssr not installed. Run: npm install @supabase/ssr');
    return null;
  }
}
