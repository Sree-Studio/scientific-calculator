// This is the "Offline copy of pages" service worker

const CACHE_NAME = "pwabuilder-offline";
const offlineFallbackPage = "index.html";

// Install stage sets up the offline page in the cache
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.add(offlineFallbackPage);
    })
  );
});

// If any request fails, this will serve the offline page
self.addEventListener("fetch", function (event) {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(offlineFallbackPage);
      })
    );
  }
});
