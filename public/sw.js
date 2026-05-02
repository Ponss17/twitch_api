const CACHE_NAME = 'losperris-twitch-monu6ykg';
const urlsToCache = [
    '/',
    '/dashboard',
    '/offline.html',
    '/manifest.json',
    '/css/base.css',
    '/css/dashboard.css',
    '/css/components/common.css',
    '/css/components/skeleton.css',
    '/css/components/footer.css',
    '/js/app-dashboard.js',
    '/js/dashboard.js',
    '/js/ui.js',
    '/js/config.js',
    '/js/utils/messages.js',
    '/js/utils/htmlLoader.js',
    '/js/utils/loader.js',
    '/js/vendor/tmi.min.js',
    '/img/logo.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    if (event.request.url.includes('/api/') ||
        event.request.url.includes('/twitch/') ||
        event.request.url.includes('/auth/') ||
        event.request.url.includes('/system/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Si es una petición de navegación (HTML) devolver página offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                    return new Response('', { status: 408, statusText: 'Offline' });
                });
            })
    );
});
