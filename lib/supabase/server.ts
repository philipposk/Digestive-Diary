import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function isCloudEnabledServer(): boolean {
  return process.env.NEXT_PUBLIC_USE_CLOUD === 'true';
}

export function getServiceRoleClient() {
  if (!isCloudEnabledServer()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseServerClient() {
  if (!isCloudEnabledServer()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Server Component — middleware handles session refresh */
        }
      },
    },
  });
}

/** @deprecated Use createSupabaseServerClient */
export function getServerSupabaseClient() {
  return createSupabaseServerClient();
}
