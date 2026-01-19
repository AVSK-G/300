/* ===== VERSION ===== */
const CACHE_VERSION = "v2";
const CACHE_NAME = "300-cache-" + CACHE_VERSION;

/* ===== FILES TO CACHE ===== */
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

/* ===== INSTALL ===== */
self.addEventListener("install", event => {
  self.skipWaiting(); // 🔥 new SW install होते ही ready

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

/* ===== ACTIVATE ===== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );

  self.clients.claim(); // 🔥 तुरंत control
});

/* ===== MESSAGE (UPDATE BUTTON SUPPORT) ===== */
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ===== FETCH ===== */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(resp => {
          // ❌ opaque / error response cache मत करो
          if (!resp || resp.status !== 200 || resp.type !== "basic") {
            return resp;
          }

          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return resp;
        })
        .catch(() => cached); // offline fallback
    })
  );
});