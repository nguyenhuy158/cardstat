// Service worker tối giản, chỉ để thoả điều kiện "installable" của Chrome
// (cần có fetch handler) và cho vài asset tĩnh chạy được khi mất mạng.
// Không cache API/trang HTML — dữ liệu chi tiêu đổi liên tục và có auth,
// cache sai sẽ lộ hoặc làm cũ dữ liệu người khác trên cùng thiết bị dùng
// chung. Chỉ cache-first cho icon do route tự sinh (nội dung không đổi theo
// user/session).
const CACHE_NAME = "cardstat-static-v1";
const STATIC_CACHE_PATHS = [
  "/icon",
  "/apple-icon",
  "/manifest-icon-192.png",
  "/manifest-icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE_PATHS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (!STATIC_CACHE_PATHS.includes(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});
