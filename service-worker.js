const CACHE_NAME = 'infave-v5';
const urlsToCache = [
  './',
  './index.html',
  './group.html',
  './styles.css',
  './app.js',
  './group.js',
  './firebase-config.js',
  './manifest.json',
  './icon-192x192.svg'
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
  const url = new URL(event.request.url);
  const isHtml = event.request.destination === 'document' || url.pathname.endsWith('index.html') || url.pathname.endsWith('group.html');
  const isScript = event.request.destination === 'script' || url.pathname.endsWith('.js');

  if (isHtml || isScript) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
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
