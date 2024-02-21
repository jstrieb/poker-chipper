/* Created by Jacob Strieb
 * February 2024
 *
 * Based on:
 *  - https://dev.to/stefnotch/enabling-coop-coep-without-touching-the-server-2d3n
 *  - https://github.com/gzuidhof/coi-serviceworker/blob/7b1d2a092d0d2dd2b7270b6f12f13605de26f214/coi-serviceworker.js
 *  - https://github.com/josephrocca/clip-image-sorter/blob/a52a4fcd85d5b2618e0f26eacd98ccd21f8a0a06/enable-threads.js
 */

const MAX_RELOADS = 10;

function reload() {
  // Count reloads to prevent infinte loops
  let num_reloads = JSON.parse(window.sessionStorage.getItem("reloads")) ?? 0;
  num_reloads++;
  if (num_reloads > MAX_RELOADS) {
    window.sessionStorage.setItem("reloads", JSON.stringify(0));
    throw new Error(`Too many reloads (>${MAX_RELOADS}).`);
  }
  window.sessionStorage.setItem("reloads", JSON.stringify(num_reloads));
  window.location.reload();
}

async function registerWorker() {
  if (!window.isSecureContext) {
    throw new Error(
      "Cannot register service worker. Not in a secure context (e.g. HTTPS or localhost).",
    );
  }
  if (!navigator?.serviceWorker) {
    throw new Error(
      "Cannot register service worker. May be in Private Browsing mode.",
    );
  }
  const registration = await navigator.serviceWorker.register(
    document.currentScript.src,
  );
  // Reload the page to activate the service worker as soon as it's ready
  registration.addEventListener("updatefound", reload);
  if (registration.active && !navigator.serviceWorker.controller) {
    reload();
  }
}

function registerWorkerHandlers() {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener("fetch", (e) => {
    console.log("Got fetch", e, e.request);
    let request = new Request(e.request, { credentials: "omit" });
    e.respondWith(
      fetch(request).then((response) => {
        const headers = new Headers(response.headers);
        // Don't use `credentialless` because we don't need it here, and it's
        // not well-enough supported anyway (e.g. not in Safari).
        // https://caniuse.com/?search=Cross-Origin-Embedder-Policy
        headers.set("Cross-Origin-Embedder-Policy", "require-corp");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(response.body, { ...response, headers });
      }),
    );
  });
}

// https://stackoverflow.com/a/4725697
if (typeof window === "undefined") {
  // Running inside a service worker
  registerWorkerHandlers();
} else {
  // Running on the main page
  (async () => {
    try {
      if (!window.crossOriginIsolated) {
        await registerWorker();
      }
    } catch (e) {
      // TODO: Handle correctly
      console.error(e);
    }
  })();
}
