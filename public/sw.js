const CACHE_NAME = 'woodledger-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // We'll add dynamic asset caching in the fetch handler
];

// Install Event - Caching static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Only handle GET requests for caching
    if (event.request.method !== 'GET') return;

    // Check if the request is for an API route
    const isApiRequest = event.request.url.includes('/api/');
    const isHealthCheck = event.request.url.includes('/api/health');

    // Do not cache health check results
    if (isHealthCheck) {
        return event.respondWith(
            fetch(event.request).catch(() => new Response(JSON.stringify({
                success: true,
                isOffline: true
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }))
        );
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If the response is valid, clone it and store in cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // If the network request fails, look in the cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // If no cache match and it's a page navigation, return offline fallback
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }

                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Offline and no cached data available',
                        isOffline: true
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            })
    );
});

// Push Notification Logic (Preserved from previous version)
self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: '2',
                    url: data.url || '/'
                }
            };
            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        } catch (e) {
            console.error('Error displaying push notification', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
