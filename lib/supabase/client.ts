// Browser Supabase client. Scaffold only — guarded behind NEXT_PUBLIC_USE_CLOUD.
//
// Usage (once enabled):
//   import { getSupabaseClient } from '@/lib/supabase/client';
//   const sb = getSupabaseClient();
//   if (sb) { ... }
//
// This file does NOT import @supabase/supabase-js at the top level. Until you run
// `npm install @supabase/supabase-js @supabase/ssr` AND set NEXT_PUBLIC_USE_CLOUD=true,
// getSupabaseClient() returns null and nothing touches the package.

type SupabaseLike = {
  auth: unknown;
  from: (table: string) => unknown;
};

let cached: SupabaseLike | null = null;

export function isCloudEnabled(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env.NEXT_PUBLIC_USE_CLOUD === 'true';
}

export function getSupabaseClient(): SupabaseLike | null {
  if (!isCloudEnabled()) return null;
  if (cached) return cached;
  if (typeof window === 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    // Runtime-only resolve keeps the bundle clean until cloud mode is enabled.
    const req = (0, eval)('typeof require !== "undefined" ? require : null');
    if (!req) return null;
    const { createClient } = req('@supabase/supabase-js');
    cached = createClient(url, anon) as SupabaseLike;
    return cached;
  } catch {
    console.warn('Supabase enabled but @supabase/supabase-js not installed. Run: npm install @supabase/supabase-js');
    return null;
  }
}
