const CACHE_NAME = "cancionero-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Solo manejamos el shell de la app (HTML/manifest).
// Los PDFs viven en IndexedDB, no pasan por aquí.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No interceptar llamadas al script de Google ni descargas de Drive
  if (url.hostname.includes("google.com") || url.hostname.includes("googleusercontent.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
