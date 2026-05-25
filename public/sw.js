// Digestive Diary service worker.
// Strategy: app shell + Next.js static assets use stale-while-revalidate, API + AI calls always go to network.
// Bump CACHE_VERSION to invalidate old caches on deploy.

const CACHE_VERSION = 'dd-v3';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache API routes / AI calls — always live.
  if (url.pathname.startsWith('/api/')) return;
  // Skip cross-origin (OpenAI, Groq, Supabase).
  if (url.origin !== self.location.origin) return;

  // Static assets + app shell — stale-while-revalidate.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/manifest.webmanifest' ||
    APP_SHELL.includes(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML navigations — network first, fall back to cached root for offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/').then((m) => m || new Response('Offline', { status: 503 })))
    );
  }
});
