import { createBrowserClient } from '@supabase/ssr';

export function isCloudEnabled(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env.NEXT_PUBLIC_USE_CLOUD === 'true';
}

export function getSupabaseClient() {
  if (!isCloudEnabled()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
