const CACHE_NAME = 'pwa-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/OnyMegaSans/MegaSans-Bold.ttf',
  '/styles/ProductSans/ProductSans-Regular.ttf',
  '/styles/main.css',
  '/styles/fonts.css',
  '/scripts/ui.js',
  '/images/supbanners/404.jpg',
  '/images/supbanners/homework.png',
  '/images/supbanners/kafeder.png',
  '/images/supbanners/kgu.png',
  '/images/supbanners/messager.png',
  '/images/supbanners/note.png',
  '/images/supbanners/notifications.png',
  '/images/supbanners/services.png',
  '/images/ui/graduation-cap.png',
  '/images/ui/work.png',
  '/images/ui/schedule.png',
  '/images/ui/messager.png',
  '/images/ui/apps.png',
  '/images/ui/notification.png',
  '/images/ui/web.png',
  '/favicon.ico',
  '/icon-192x192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Кэшируем ресурсы');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
