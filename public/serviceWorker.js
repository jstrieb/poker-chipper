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
      let response = await caches.match(request);
      if (response) {
        return response;
      }
      response = await fetch(request);
      const cache = await caches.open("cache");
      await cache.put(request, response.clone());
      return response;
    })(),
  );
});
