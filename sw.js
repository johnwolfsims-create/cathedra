/* Cathedra offline: keep a copy of the app; refresh it quietly whenever the network is there. */
var CACHE = 'cathedra-v30';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    // fonts from Google: use the cache when offline
    e.respondWith(caches.open(CACHE).then(function (c) {
      return fetch(e.request).then(function (r) { c.put(e.request, r.clone()); return r; }).catch(function () { return c.match(e.request); });
    }));
    return;
  }
  // network first so updates arrive, cache when the network is gone
  // always ask GitHub whether there is something newer (a quick check), never trust a stale browser copy
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (r) {
    var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return r;
  }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); }); }));
});
