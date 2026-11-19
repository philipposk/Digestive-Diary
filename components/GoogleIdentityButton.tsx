"use client";

/**
 * Google sign-in via Google Identity Services (popup/FedCM) + supabase.auth.signInWithIdToken.
 *
 * Why: signInWithOAuth makes Google say "to continue to <ref>.supabase.co", because Supabase
 * sends its own callback URL as redirect_uri. With GIS the request comes from this app's origin,
 * so Google shows the app/brand instead. Free (no Supabase custom domain).
 * Needs: this app's production origin in the Google OAuth client's "Authorized JavaScript origins".
 * If the GIS script can't load (blocked, offline), the children (the old redirect button) render.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Shared 6x7 Supabase project's Google client (public; it is in every /authorize redirect). */
export const DEFAULT_GOOGLE_CLIENT_ID =
  "387497462976-atlmglcgdgl9t9fhjdacj0vecn3d580d.apps.googleusercontent.com";

type IdTokenAuth = {
  auth: {
    signInWithIdToken(args: { provider: "google"; token: string; nonce?: string }): Promise<{ error: unknown }>;
  };
};
type GoogleIdApi = {
  initialize(config: Record<string, unknown>): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
};
type GoogleGlobal = { accounts?: { id?: GoogleIdApi } };

function gisApi(): GoogleIdApi | undefined {
  return (window as unknown as { google?: GoogleGlobal }).google?.accounts?.id;
}

function loadGis(): Promise<GoogleIdApi> {
  const ready = gisApi();
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gis-client") as HTMLScriptElement | null;
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => {
      const api = gisApi();
      if (api) resolve(api);
      else reject(new Error("GIS missing"));
    });
    s.addEventListener("error", () => reject(new Error("GIS failed to load")));
    if (!existing) {
      s.id = "gis-client";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}


/* ── Pending state (double-submit protection) ─────────────────────────────────────────────────────────────────
 * From the moment Google's button (or the redirect fallback) is clicked until the browser navigates away: the
 * button is replaced by a same-size "Signing in…" spinner (aria-busy), every other button / form submit in the
 * same screen is disabled, and repeat clicks are ignored. Cleared on error, when the Google chooser is closed
 * without a credential, and when the page returns from the back/forward cache (pageshow.persisted). */
function pendingLabel(): string {
  const l = (document.documentElement.lang || navigator.language || "en").toLowerCase();
  if (l.startsWith("el")) return "Σύνδεση…";
  if (l.startsWith("da")) return "Logger ind…";
  return "Signing in…";
}

/** Hosts whose origin is NOT registered as an "Authorized JavaScript origin" on the Google OAuth client: Google's popup
 * fails there with Error 400 origin_mismatch, so they use the redirect button (Supabase OAuth) instead. Remove a host
 * pattern here once its origin is added in Google Cloud Console (APIs & Services -> Credentials). */
const GIS_UNREGISTERED_ORIGIN = /\.6x7\.dk$/i;

export function GoogleIdentityButton({
  getSupabase,
  onSignedIn,
  onError,
  clientId = DEFAULT_GOOGLE_CLIENT_ID,
  text = "continue_with",
  children,
  forceFallback = false,
}: {
  /** Returns the app's browser Supabase client. */
  getSupabase: () => IdTokenAuth;
  /** Called after Supabase has a session (e.g. navigate to `next`). */
  onSignedIn: () => void;
  onError?: (message: string) => void;
  clientId?: string;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  /** Fallback rendered if Google's script can't load: the classic redirect button. */
  children?: ReactNode;
  /** Render the fallback instead (e.g. inside a Capacitor WebView, where Google blocks GIS). */
  forceFallback?: boolean;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const cb = useRef({ getSupabase, onSignedIn, onError });
  useEffect(() => {
    cb.current = { getSupabase, onSignedIn, onError };
  });

  const wrap = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const gotCredential = useRef(false);
  const watch = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<() => void>(() => {});
  const begin = () => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setPending(true);
    return true;
  };
  endRef.current = () => {
    watch.current?.stop();
    pendingRef.current = false;
    setPending(false);
  };
  // Google draws its button in an iframe, so a click is only seen through click_listener. If the chooser is closed
  // (popup closed / FedCM dismissed) no credential arrives: once the window regains focus and nothing came back
  // shortly after, release the button. A hard cap covers anything else (and the redirect fallback on error).
  function startWatch(capMs: number, watchFocus: boolean) {
    watch.current?.stop();
    gotCredential.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFocus = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (!gotCredential.current) endRef.current(); }, 1500);
    };
    const cap = setTimeout(() => { if (!gotCredential.current) endRef.current(); }, capMs);
    const stop = () => {
      window.removeEventListener("focus", onFocus);
      clearTimeout(timer); clearTimeout(cap);
      watch.current = null;
    };
    if (watchFocus) window.addEventListener("focus", onFocus);
    watch.current = { stop };
  }
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) endRef.current(); };
    window.addEventListener("pageshow", onShow);
    return () => { window.removeEventListener("pageshow", onShow); watch.current?.stop(); };
  }, []);
  // While pending, disable every other button / submit on this screen (restored afterwards) and block submits.
  useEffect(() => {
    if (!pending) return;
    const scope: ParentNode = wrap.current?.closest("main,[role='dialog']") ?? wrap.current?.parentElement?.parentElement ?? document.body;
    const touched: HTMLElement[] = [];
    scope.querySelectorAll<HTMLElement>("button, input[type='submit'], input[type='button']").forEach((el) => {
      if (wrap.current?.contains(el) || (el as HTMLButtonElement).disabled) return;
      (el as HTMLButtonElement).disabled = true;
      el.setAttribute("data-auth-pending", "");
      touched.push(el);
    });
    const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener("submit", block, true);
    document.documentElement.setAttribute("data-auth-pending", "1");
    return () => {
      document.removeEventListener("submit", block, true);
      document.documentElement.removeAttribute("data-auth-pending");
      touched.forEach((el) => { (el as HTMLButtonElement).disabled = false; el.removeAttribute("data-auth-pending"); });
    };
  }, [pending]);

  useEffect(() => {
    if (forceFallback) return;
    let cancelled = false;
    (async () => {
      try {
        // Google blocks its sign-in inside app WebViews (Capacitor shells): keep the native redirect flow.
        const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        if (cap?.isNativePlatform?.()) throw new Error("native shell");
        if (GIS_UNREGISTERED_ORIGIN.test(window.location.hostname)) throw new Error("origin not registered for Google sign-in");
        const gis = await loadGis();
        if (cancelled || !slot.current) return;
        const rawNonce = crypto.randomUUID() + crypto.randomUUID();
        const hashedNonce = await sha256Hex(rawNonce);
        gis.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: async ({ credential }: { credential: string }) => {
            gotCredential.current = true;
            watch.current?.stop();
            if (!pendingRef.current) begin();
            const { error } = await cb.current.getSupabase().auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce: rawNonce,
            });
            if (error) endRef.current();
            if (error) cb.current.onError?.("Google sign-in failed. Please try again.");
            else cb.current.onSignedIn();
          },
        });
        gis.renderButton(slot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: Math.min(slot.current.clientWidth || 320, 400),
          click_listener: () => {
            if (begin()) startWatch(120000, true);
          },
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, text, forceFallback]);

  const idle = failed || forceFallback;
  return (
    <div
      ref={wrap}
      style={{ position: "relative", width: "100%" }}
      // The redirect fallback (a plain button elsewhere): treat its click as the start of a sign-in too.
      onClickCapture={idle ? (e) => {
        if (pendingRef.current) { e.preventDefault(); e.stopPropagation(); return; }
        if ((e.target as HTMLElement).closest("button, a")) { begin(); startWatch(15000, false); }
      } : undefined}
    >
      <style>{"@keyframes gib-rot{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.gib-spin{animation-duration:2s!important}}html[data-auth-pending] [data-auth-pending]{cursor:progress}"}</style>
      {idle ? (
        <div aria-hidden={pending || undefined} style={{ visibility: pending ? "hidden" : undefined }}>{children}</div>
      ) : (
        <div ref={slot} aria-hidden={pending || undefined} style={{ width: "100%", display: "flex", justifyContent: "center", minHeight: 44, visibility: pending ? "hidden" : undefined }} />
      )}
      {pending && (
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          style={{ position: "absolute", inset: 0, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(128,128,128,.45)", borderRadius: 999, fontSize: 14, cursor: "progress", color: "inherit", background: "transparent" }}
        >
          <span className="gib-spin" aria-hidden="true" style={{ width: 14, height: 14, border: "2px solid currentColor", borderRightColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "gib-rot .7s linear infinite" }} />
          {pendingLabel()}
        </div>
      )}
    </div>
  );
}
