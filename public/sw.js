const IS_LOCAL_DEV =
    self.location?.hostname === 'localhost' || self.location?.hostname === '127.0.0.1';

/** En localhost el SW se auto-destruye: rompe Vite HMR y deps (/node_modules/.vite/deps). */
if (IS_LOCAL_DEV) {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches
                .keys()
                .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                .then(() => self.registration.unregister())
        );
    });
} else {
    const CACHE_NAME = 'losperris-twitch-v10';
    /** Solo assets estáticos — no precachear páginas SSR (evita invocaciones extra en install). */
    const urlsToCache = ['/offline', '/manifest.json', '/img/logo.svg', '/img/favicon.svg'];

    const isCacheFirstAsset = (url) =>
        url.includes('/img/') ||
        url.includes('/favicon') ||
        url.includes('/manifest.json') ||
        url.endsWith('.svg') ||
        url.endsWith('.webp') ||
        url.endsWith('.png');

    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then((cache) => cache.addAll(urlsToCache))
                .then(() => self.skipWaiting())
        );
    });

    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches
                .keys()
                .then((cacheNames) =>
                    Promise.all(cacheNames.map((cacheName) => cacheName !== CACHE_NAME && caches.delete(cacheName)))
                )
                .then(() => self.clients.claim())
        );
    });

    self.addEventListener('fetch', (event) => {
        if (event.request.method !== 'GET') return;

        const url = event.request.url;

        if (
            url.includes('/@vite/') ||
            url.includes('/@id/') ||
            url.includes('/@fs/') ||
            url.includes('/src/') ||
            url.includes('/node_modules/') ||
            url.includes('/_astro/') ||
            url.includes('/api/') ||
            url.includes('/auth/') ||
            url.includes('/dashboard')
        ) {
            return;
        }

        if (isCacheFirstAsset(url)) {
            event.respondWith(
                caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    return fetch(event.request).then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                        }
                        return response;
                    });
                })
            );
            return;
        }

        /** Offline: red primero; caché solo si falla la red (sin cache.put en cada GET). */
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline');
                    }
                    return new Response('', { status: 408, statusText: 'Offline' });
                })
            )
        );
    });
}
