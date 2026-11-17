// Offline support. The page is fetched from the network first (so updates arrive on their own),
// and from the cache when there is no connection. Everything else is served from the cache.
const VERSION = 'lc-9ad1f2228b';
const SHELL = ["./","index.html","manifest.webmanifest","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","fonts/ibm-plex-sans-hebrew-hebrew-400-normal.woff2","fonts/ibm-plex-sans-hebrew-latin-400-normal.woff2","fonts/ibm-plex-sans-hebrew-hebrew-500-normal.woff2","fonts/ibm-plex-sans-hebrew-latin-500-normal.woff2","fonts/ibm-plex-sans-hebrew-hebrew-600-normal.woff2","fonts/ibm-plex-sans-hebrew-latin-600-normal.woff2","fonts/ibm-plex-sans-hebrew-hebrew-700-normal.woff2","fonts/ibm-plex-sans-hebrew-latin-700-normal.woff2","fonts/karantina-hebrew-400-normal.woff2","fonts/karantina-latin-400-normal.woff2","fonts/karantina-hebrew-700-normal.woff2","fonts/karantina-latin-700-normal.woff2"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lc-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((r) => { clearTimeout(t); resolve(r); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      withTimeout(fetch(req), 4000)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('index.html', { ignoreSearch: true }))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
