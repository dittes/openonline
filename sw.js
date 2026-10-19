/* global [
  "/",
  "/en/",
  "/de/",
  "/cs/",
  "/pl/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/assets/index-CYs4C9y8.js",
  "/assets/i18n-CrbNJ_is.js",
  "/assets/ui-sVZT-9HZ.js",
  "/assets/Brand-CUFwjEUR.js",
  "/assets/registry-DUTKct5Q.js",
  "/assets/router-G2WiWCiX.js",
  "/assets/zip-BupNl4DY.js",
  "/assets/text-j3tuA5X2.js",
  "/assets/tar-BVhxHTuQ.js",
  "/assets/content-CXV5ed_3.js",
  "/assets/preload-helper-BLdHbfdN.js",
  "/assets/session-De_zYxvA.js",
  "/assets/chevron-down-BUG62fV4.js",
  "/assets/x-CkhnRGwA.js",
  "/assets/eighth-notes-BYmQzhTe.js",
  "/assets/type-CUAjaetn.js",
  "/assets/lock-keyhole-Dt3dS3NB.js",
  "/assets/search-CrKaU0m4.js",
  "/assets/download-BdQD0xvr.js",
  "/assets/types-BJgKZ8aa.js",
  "/assets/index-MmEknGeG.css",
  "/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2",
  "/assets/inter-latin-wght-normal-Dx4kXJAl.woff2"
] */
/* Open Online service worker.
 *
 * Caches the application's own files so the app keeps working offline.
 * It never sees or stores the files users open: those are read directly by
 * the page and are never requested over the network.
 */
const VERSION = '2170ebd9153d';
const CACHE = `open-online-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('open-online-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAsset = (url) => url.pathname.startsWith('/assets/') || url.pathname.startsWith('/vendor/') || url.pathname.startsWith('/icons/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first, fall back to the cached page or the app shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('/'))),
    );
    return;
  }

  // Hashed build assets never change: cache first, then network (and remember it).
  if (isAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else (manifest, favicon …): stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
