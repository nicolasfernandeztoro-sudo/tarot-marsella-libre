const CACHE_NAME = "tarot-marsella-libre-v13";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/src/main.js",
  "/src/styles/main.css",
  "/cartas/el-loco.jpg",
  "/cartas/el-mago.jpg",
  "/cartas/la-papisa.jpg",
  "/cartas/la-emperatriz.jpg",
  "/cartas/el-emperador.jpg",
  "/cartas/el-papa.jpg",
  "/cartas/el-enamorado.jpg",
  "/cartas/el-carro.jpg",
  "/cartas/la-justicia.jpg",
  "/cartas/el-ermitano.jpg",
  "/cartas/la-rueda.jpg",
  "/cartas/la-fuerza.jpg",
  "/cartas/el-colgado.jpg",
  "/cartas/arcano-sin-nombre.jpg",
  "/cartas/la-templanza.jpg",
  "/cartas/el-diablo.jpg",
  "/cartas/la-torre.jpg",
  "/cartas/la-estrella.jpg",
  "/cartas/la-luna.jpg",
  "/cartas/el-sol.jpg",
  "/cartas/el-juicio.jpg",
  "/cartas/el-mundo.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (isFreshAsset(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

function isFreshAsset(url) {
  return [
    "/index.html",
    "/src/main.js",
    "/src/styles/main.css",
    "/manifest.webmanifest",
    "/sw.js"
  ].includes(url.pathname);
}
