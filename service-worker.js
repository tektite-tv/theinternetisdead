self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  const url = new URL(event.request.url);
  if (!/^\/dead\/videos\/[^/]+\/?$/.test(url.pathname)) return;

  event.respondWith(fetch('/index.html', { cache: 'no-store' }));
});
