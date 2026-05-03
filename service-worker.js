self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  const url = new URL(event.request.url);
  const isVideoPathRoute = /^\/dead\/videos\/[^/]+\/?$/.test(url.pathname);
  const isVideoQueryRoute = /^\/dead\/videos\/?$/.test(url.pathname)
    && (url.searchParams.has('vid') || url.searchParams.has('id'));
  if (!isVideoPathRoute && !isVideoQueryRoute) return;

  event.respondWith(fetch('/index.html', { cache: 'no-store' }));
});
