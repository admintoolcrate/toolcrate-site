// Minimal service worker. Two jobs:
// 1. Its mere presence (with a fetch handler) is one of Chrome/Edge's hard
//    requirements for a page to be considered installable at all — without
//    this, beforeinstallprompt never fires, so there's no "Install" option
//    on those browsers no matter how long you wait.
// 2. A real stale-while-revalidate cache for this site's own pages/assets,
//    so installed tools actually work offline instead of just being
//    pinned shortcuts that fail to load without a connection.
//
// Cross-origin requests (the bass sample CDN, ads, the ko-fi widget) are
// left completely untouched — only this site's own same-origin GETs are
// cached.

const CACHE_NAME = 'toolcrate-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
