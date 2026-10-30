/* global [
  "/",
  "/en/",
  "/de/",
  "/cs/",
  "/pl/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/assets/index-gc3K0047.js",
  "/assets/i18n-DNvCkWfv.js",
  "/assets/ui-DwfObxh6.js",
  "/assets/Brand-Ca1GRYL-.js",
  "/assets/registry-B4tNr8dF.js",
  "/assets/router-DB3Zm9wN.js",
  "/assets/zip-rqYt5yqM.js",
  "/assets/text-j3tuA5X2.js",
  "/assets/tar-Dz39YWCh.js",
  "/assets/content-CMwgtPCn.js",
  "/assets/preload-helper-BLdHbfdN.js",
  "/assets/session-BDPY_DnG.js",
  "/assets/chevron-down-Dh9QRnyq.js",
  "/assets/x-DXO5pZ--.js",
  "/assets/eighth-notes-BAq2INqL.js",
  "/assets/type-YAwfNRNH.js",
  "/assets/lock-keyhole-DEJ5-Khy.js",
  "/assets/search-CCge4UVA.js",
  "/assets/download-BdQD0xvr.js",
  "/assets/types-BJgKZ8aa.js",
  "/assets/index-C3YCwpfW.css",
  "/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2",
  "/assets/inter-latin-wght-normal-Dx4kXJAl.woff2"
] */
/* Open Online service worker.
 *
 * Caches the application's own files so the app keeps working offline.
 * It never sees or stores the files users open: those are read directly by
 * the page and are never requested over the network.
 */
const VERSION = '3ca4e4686473';
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
