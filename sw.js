// sw.js — ne gère QUE /caisse-bar/
const SCOPE_PATH = '/caisse-bar/';
const CACHE_VERSION = 'v1.0.6';                 // ← bump pour forcer la MAJ
const CACHE_NAME    = `caisse-${CACHE_VERSION}`;

const ASSETS = [
  '/caisse-bar/',
  '/caisse-bar/index.html',
  '/caisse-bar/manifest.webmanifest',
  '/caisse-bar/sw.js',
  '/caisse-bar/icons/icon-192.png',
  '/caisse-bar/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // purge anciens caches de la caisse
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k.startsWith('caisse-') && k !== CACHE_NAME).map(k => caches.delete(k))
      );
      // prend le contrôle immédiatement
      await self.clients.claim();
    })()
  );
});

// Network-first pour les navigations, cache-first pour le reste
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 🔒 NE S'OCCUPE QUE de /caisse-bar/
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/caisse-bar/index.html', { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    (async () => {
      // cache-first (ignoreSearch pour les ?v=123 etc.)
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;

      const netRes = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, netRes.clone()).catch(()=>{});
      return netRes;
    })()
  );
});
