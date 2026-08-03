// Brick'd service worker — offline app shell.
//
// Grocery stores have terrible signal, so the app must open without a
// connection. Strategy:
//   - Expo's JS/asset filenames are content-hashed, so they're safe to
//     cache forever (cache-first).
//   - index.html is network-first with a cache fallback, so a new
//     deploy is picked up as soon as there's a connection but the app
//     still opens offline.
//   - API calls (USDA, Supabase, OCR, Overpass) are never cached — the
//     app already handles their failures gracefully.

const VERSION = 'brickd-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never cache other origins (APIs, auth, fonts from CDNs).
  if (url.origin !== self.location.origin) return;

  // Content-hashed bundles and images: cache-first.
  if (url.pathname.startsWith('/_expo/') || /\.(png|ico|ttf|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Navigations / everything else same-origin: network-first, fall back
  // to the cached shell so the app still opens offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || caches.match('/index.html'))
      )
  );
});
