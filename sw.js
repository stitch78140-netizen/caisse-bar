// sw.js — /caisse-bar/ uniquement (le scope vient du register côté page)

const CACHE_VERSION = 'v1.0.5';
const CACHE_NAME = `caisse-${CACHE_VERSION}`;

// Chemins ABSOLUS vers les assets de l’app /caisse-bar/
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
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith('caisse-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Stratégie: network-first pour les navigations, cache-first pour le reste
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/caisse-bar/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request).then(netRes => {
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRes.clone()));
      return netRes;
    }))
  );
});
