import type { NextRequest, NextResponse } from "next/server";

/**
 * Records that the signed-in user used this app, in the shared 6x7 table
 * public.app_access (user_id, app, first_seen, last_seen; RLS = own rows).
 * first_seen of a user's earliest row = the app they signed up on.
 * Throttled by a host-only cookie so it writes at most once per 6h per browser.
 * Never throws and never blocks the request for more than ~1.5s.
 */
export async function trackAppAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  user: { id: string } | null | undefined,
  req: NextRequest,
  res: NextResponse,
  app: string,
) {
  if (!user) return;
  const cookie = `x6_seen_${app}`;
  if (req.cookies.get(cookie)?.value === user.id.slice(0, 8)) return;
  try {
    const result = (await Promise.race([
      supabase
        .schema("public")
        .from("app_access")
        .upsert({ user_id: user.id, app, last_seen: new Date().toISOString() }, { onConflict: "user_id,app" }),
      new Promise((r) => setTimeout(() => r({ error: "timeout" }), 1500)),
    ])) as { error?: unknown } | undefined;
    // Only throttle after a successful write, so a failed/slow write is retried next request.
    if (!result || result.error) return;
    res.cookies.set(cookie, user.id.slice(0, 8), {
      maxAge: 6 * 3600, httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production",
    });
  } catch {
    /* tracking must never break auth */
  }
}
