/* Minimal offline shell — base path は sw の置き場所から自動算出（GitHub Pages 対応） */
const CACHE = 'juken-rpg-v3';

/** /highschool-juken/sw.js → /highschool-juken/ */
const BASE =
  self.location.pathname.replace(/[^/]+\.js$/, '') || '/';

self.addEventListener('install', (event) => {
  const origin = self.location.origin;
  const urls = [
    origin + BASE,
    origin + BASE + 'index.html',
    origin + BASE + 'manifest.webmanifest',
    origin + BASE + 'favicon.png',
    origin + BASE + 'pwa-192.png',
    origin + BASE + 'pwa-512.png',
    origin + BASE + 'apple-touch-icon.png',
  ];
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(urls))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const c = await caches.match(originIndex());
        return c || Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res.ok && request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      });
    }),
  );
});

function originIndex() {
  return self.location.origin + BASE + 'index.html';
}
