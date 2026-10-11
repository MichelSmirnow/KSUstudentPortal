/* Offline cache for image files hosted on Postimages. */
const IMAGE_CACHE_NAME = 'student-kgu-postimages-v1';
const IMAGE_CACHE_LIMIT = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('student-kgu-postimages-') && name !== IMAGE_CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.destination !== 'image') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Не кэшируем произвольные внешние ресурсы приложения — только картинки Postimages.
  if (!/(postimg|postimages)/i.test(url.hostname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cached = await cache.match(request, { ignoreVary: true });

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        try {
          await cache.put(request, response.clone());
          const keys = await cache.keys();
          if (keys.length > IMAGE_CACHE_LIMIT) {
            await cache.delete(keys[0]);
          }
        } catch (_) {
          // Если кэш заполнен/недоступен, всё равно возвращаем сетевую картинку.
        }
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      return new Response('', { status: 504, statusText: 'Image unavailable offline' });
    }
  })());
});
