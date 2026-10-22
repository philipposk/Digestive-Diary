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

  useEffect(() => {
    if (forceFallback) return;
    let cancelled = false;
    (async () => {
      try {
        // Google blocks its sign-in inside app WebViews (Capacitor shells): keep the native redirect flow.
        const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        if (cap?.isNativePlatform?.()) throw new Error("native shell");
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
            const { error } = await cb.current.getSupabase().auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce: rawNonce,
            });
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
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, text, forceFallback]);

  if (failed || forceFallback) return <>{children}</>;
  return <div ref={slot} style={{ width: "100%", display: "flex", justifyContent: "center", minHeight: 44 }} />;
}
