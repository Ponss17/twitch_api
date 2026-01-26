// Service Worker para soporte offline
const CACHE_NAME = 'losperris-api-v1';
const urlsToCache = [
    '/',
    '/dashboard',
    '/css/base.css',
    '/css/dashboard.css',
    '/css/components/common.css',
    '/css/sections/analytics.css',
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
    '/img/LosPerris_progra.webp'
];

// Instalación
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activación
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

// Fetch - Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    // Solo cachear GET requests
    if (event.request.method !== 'GET') return;

    // No cachear API calls
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('/twitch/') ||
        event.request.url.includes('/auth/') ||
        event.request.url.includes('/system/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clonar response para cachear
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Si falla network, usar cache
                return caches.match(event.request);
            })
    );
});
