const CACHE_NAME = 'infave-v1';
const urlsToCache = [
  '/Infave/',
  '/Infave/index.html',
  '/Infave/group.html',
  '/Infave/styles.css',
  '/Infave/app.js',
  '/Infave/group.js',
  '/Infave/firebase-config.js',
  '/Infave/manifest.json',
  '/Infave/icon-192x192.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.log('Failed to cache:', url);
            }).catch(err => {
              console.log('Error fetching:', url, err);
            })
          )
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // If fetch fails, return a simple offline message for HTML requests
          if (event.request.destination === 'document') {
            return new Response('Offline - Please check your connection', {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
