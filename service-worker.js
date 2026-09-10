// Offline shell for the PDF viewer. Everything the app needs is on this origin.
//
// Two strategies, split by how often a file changes:
//   - the libraries and icons never change without a version bump here, so they
//     are served from the cache and refreshed in the background;
//   - the app's own HTML, CSS and JS are fetched from the network first, so a
//     new deploy reaches an installed app on its next launch, and fall back to
//     the cache when there is no network.
//
// Bump CACHE_VERSION when a precached library changes, or to force every
// installed copy to discard what it has.
const CACHE_VERSION = 'pdf-studio-v17';

const PRECACHE = [
  './',
  './index.html',
  './instructions.html',
  './style.css',
  './script.js',
  './db.js',
  './manifest.json',
  './lib/pdfjs/pdf.mjs',
  './lib/pdfjs/pdf.worker.mjs',
  './lib/pdf-lib/pdf-lib.esm.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

// Only these change with their library, never with an ordinary deploy.
function isImmutable(url) {
  return url.pathname.includes('/lib/') || url.pathname.includes('/icons/');
}

// index.html asks for style.css?v=35, then ?v=36 after a deploy. Keeping only
// the newest copy of each path stops old versions piling up, and stops a stale
// one being picked ahead of the new file when a lookup ignores the query.
async function store(request, response) {
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response);

  const url = new URL(request.url);
  const keys = await cache.keys();
  await Promise.all(keys.map(key => {
    const keyUrl = new URL(key.url);
    if (keyUrl.pathname === url.pathname && keyUrl.search !== url.search) {
      return cache.delete(key);
    }
    return undefined;
  }));
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    // Best effort refresh for the next launch. Not awaited: the cached copy is
    // already the answer, and offline this simply fails.
    fetch(request)
      .then(response => (response && response.ok ? store(request, response) : undefined))
      .catch(() => { /* offline */ });
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) await store(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirst(request) {
  try {
    // 'no-cache' means revalidate with the server every time (a 304 is cheap),
    // not "skip the cache". Without it, fetch() can answer from the HTTP cache
    // — index.html and instructions.html carry no ?v= token, so a heuristically
    // fresh copy is served with transferSize 0 and then store()d, fossilising
    // the stale page in the SW cache too.
    const response = await fetch(request, { cache: 'no-cache' });
    if (response && response.ok) await store(request, response.clone());
    return response;
  } catch {
    // Offline. Try the exact URL, then the same path under any version, so a
    // page cached at ?v=35 still loads when the shell asks for ?v=36.
    const exact = await caches.match(request);
    if (exact) return exact;

    const loose = await caches.match(request, { ignoreSearch: true });
    if (loose) return loose;

    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html', { ignoreSearch: true });
      if (shell) return shell;
    }
    return Response.error();
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll is all-or-nothing, so one bad entry would leave the app with no
      // cache at all. Fetch each file on its own and keep what succeeds.
      .then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(err => {
        console.warn('[sw] could not precache', url, err);
      }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Analytics and anything else off this origin stays on the network. It is
  // not part of the app, and caching it would only hide failures.
  if (url.origin !== self.location.origin) return;

  event.respondWith(isImmutable(url) ? cacheFirst(request) : networkFirst(request));
});
