self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  const url = new URL(event.request.url);
  const rootShortPathRedirects = {
    '/games': '/dead/games/',
    '/games/': '/dead/games/',
    '/experiments': '/dead/experiments/',
    '/experiments/': '/dead/experiments/'
  };
  const rootShortPathRedirect = rootShortPathRedirects[url.pathname.replace(/\/{2,}/g, '/')];
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
    && (url.searchParams.has('video_embed') || url.searchParams.has('vid') || url.searchParams.has('id'));
  if (!isExperimentShortPath && !isVideoPathRoute && !isVideoQueryRoute) return;

  event.respondWith(fetch('/index.html', { cache: 'no-store' }));
});
