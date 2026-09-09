// Offline shell for the PDF viewer. Everything the app needs is on this origin,
// so the whole shell is precached on install and served from the cache first.
// Bump CACHE_VERSION whenever a precached file changes, the same rule as the
// ?v= query strings in index.html.
const CACHE_VERSION = 'pdf-studio-v1';

// Query strings are stripped when matching (ignoreSearch), so the ?v= keys in
// index.html do not need to be repeated here.
const SHELL = [
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll is all-or-nothing, so one bad entry would leave the app with no
      // cache at all. Fetch each file on its own and keep what succeeds.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(err => {
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

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) {
        // Refresh in the background so the next launch picks up a new deploy.
        event.waitUntil(
          fetch(request)
            .then(response => {
              if (response && response.ok) {
                return caches.open(CACHE_VERSION).then(c => c.put(request, response));
              }
            })
            .catch(() => { /* offline: the cached copy is the answer */ })
        );
        return cached;
      }

      return fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_VERSION).then(c => c.put(request, copy)));
          }
          return response;
        })
        .catch(() => {
          // A navigation with nothing cached still needs a page to land on.
          if (request.mode === 'navigate') {
            return caches.match('./index.html', { ignoreSearch: true });
          }
          return Response.error();
        });
    })
  );
});
