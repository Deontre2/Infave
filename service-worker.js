const CACHE_NAME = 'infave-v3';
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
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If not in cache and offline, return offline message for HTML
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
