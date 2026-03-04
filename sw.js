const CACHE_NAME = 'al-hikmah-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic network-first strategy for APIs, fallback to fetch
    event.respondWith(fetch(event.request).catch(() => {
        return new Response("Network error occurred.");
    }));
});
