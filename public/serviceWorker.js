self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const { request } = e;
      let cached = await caches.match(request);
      if (cached && new URL(request.url).pathname.match(/\/scip\./)) {
        return cached;
      }
      let response = await fetch(request).catch(() => ({ ok: false }));
      if (response.ok) {
        const cache = await caches.open("cache");
        await cache.put(request, response.clone()).catch(() => {});
        return response;
      }
      return cached;
    })(),
  );
});
