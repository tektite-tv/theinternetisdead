self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  if (event.request.destination && event.request.destination !== 'document') return;

  const url = new URL(event.request.url);
  const normalizedPath = url.pathname.replace(/\/{2,}/g, '/');
  const rootShortPathRedirects = {
    '/games': '/dead/games/',
    '/games/': '/dead/games/',
    '/experiments': '/dead/experiments/',
    '/experiments/': '/dead/experiments/',
    '/tools': '/dead/tools/',
    '/tools/': '/dead/tools/'
  };
  const rootShortPathRedirect = rootShortPathRedirects[normalizedPath];
  if (rootShortPathRedirect) {
    event.respondWith(Response.redirect(new URL(rootShortPathRedirect + url.search + url.hash, url.origin).href, 302));
    return;
  }

  const experimentShortPaths = new Set([
    'bookmark-manager',
    'bookmarks-manager',
    'canvas-backgrounds',
    'chat-sandbox',
    'gods-eye',
    'mandala-visuals',
    'multimedia-editor',
    'music-player',
    'pdf-viewer',
    'photosphere',
    'sound-machine',
    'stacks',
    'test'
  ]);
  const shortExperimentMatch = url.pathname
    .replace(/\/{2,}/g, '/')
    .match(/^\/([^/]+)(?:\/(?:index\.html)?)?$/);
  const isExperimentShortPath = !!(
    shortExperimentMatch &&
    experimentShortPaths.has(decodeURIComponent(shortExperimentMatch[1]))
  );
  const isVideoPathRoute = /^\/dead\/videos\/[^/]+\/?$/.test(url.pathname);
  const isVideoQueryRoute = /^\/dead\/videos\/?$/.test(url.pathname)
    && (url.searchParams.has('vid') || url.searchParams.has('id'));
  const isDeadHtmlRoute = normalizedPath.startsWith('/dead/') &&
    !normalizedPath.startsWith('/dead/JSON/') &&
    !normalizedPath.startsWith('/dead/audio/') &&
    !normalizedPath.startsWith('/dead/images/') &&
    !normalizedPath.startsWith('/dead/messages/') &&
    !normalizedPath.startsWith('/dead/scripts/') &&
    !/\.(?:css|js|mjs|json|map|png|jpe?g|gif|webp|svg|ico|mp3|wav|ogg|pdf|zip|md|txt)$/i.test(normalizedPath);
  if (!isExperimentShortPath && !isVideoPathRoute && !isVideoQueryRoute && !isDeadHtmlRoute) return;

  event.respondWith(fetch('/index.html', { cache: 'no-store' }));
});
