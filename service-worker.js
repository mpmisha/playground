// Playground hub service worker. Scope is /playground/ only — each game site
// under mpmisha.github.io has its own independent service worker, so the hub
// never caches game code. We keep the menu working offline and always try the
// network first for the registry so newly added games appear promptly.
const CACHE = 'playground-v18';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './js/main.js',
  './js/i18n.js',
  './js/telemetry.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Only handle our own origin/scope; let game sites manage themselves.
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return resp;
        }).catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Registry: network-first so new games show up, fall back to cache offline.
  if (url.pathname.endsWith('/games.json')) {
    event.respondWith(
      fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(request)),
    );
    return;
  }

  // Navigations: network-first so a fresh index.html (and thus the latest hub)
  // is delivered whenever online; fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(request).then((c) => c || caches.match('./index.html'))),
    );
    return;
  }

  // Same-origin assets (css / js / icons): network-first, so the whole shell
  // updates together and can never skew against the network-first index.html
  // (which previously produced new HTML rendered by stale cached CSS/JS).
  // Falls back to the cached copy when offline.
  event.respondWith(
    fetch(request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(request)),
  );
});
