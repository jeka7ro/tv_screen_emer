/**
 * Service Worker for TV Media Caching
 * 
 * Caches media files (images, videos) from Supabase Storage locally
 * to dramatically reduce bandwidth (egress) consumption.
 * 
 * Strategy: Cache-First for media files from Supabase
 * - First request: fetch from network, store in cache
 * - Subsequent requests: serve from cache (no network egress)
 * - Cache is versioned and can be busted when content changes
 */

const CACHE_NAME = 'media-cache-v2';
const SUPABASE_STORAGE_PATTERN = /supabase\.co\/storage/;
const NETLIFY_PROXY_PATTERN = /\/supabase-(media|audio)\//;
const MEDIA_EXTENSIONS = /\.(mp4|webm|mov|avi|jpg|jpeg|png|gif|webp|svg|mp3|wav|ogg)(\?.*)?$/i;
const LOCAL_UPLOADS_PATTERN = /\/api\/uploads\//;

// Install event - pre-cache nothing, we cache on demand
self.addEventListener('install', (event) => {
    console.log('[MediaCacheSW] Installing...');
    self.skipWaiting(); // Activate immediately
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[MediaCacheSW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('media-cache-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[MediaCacheSW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim()) // Take control of all pages immediately
    );
});

// Fetch event - intercept media requests
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Only cache GET requests for media files
    if (event.request.method !== 'GET') return;

    // Check if this is a media file from Supabase, Netlify proxy, or local uploads
    const isSupabaseMedia = SUPABASE_STORAGE_PATTERN.test(url);
    const isNetlifyProxy = NETLIFY_PROXY_PATTERN.test(url);
    const isLocalUploads = LOCAL_UPLOADS_PATTERN.test(url);
    const isMediaFile = MEDIA_EXTENSIONS.test(url);

    // Cache proxied URLs (/supabase-media/*) even without file extension (Supabase UUIDs)
    if (isNetlifyProxy || ((isSupabaseMedia || isLocalUploads) && isMediaFile)) {
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

/**
 * Cache-First Strategy:
 * 1. Check cache for existing response
 * 2. If found, return cached response (ZERO egress!)
 * 3. If not found, fetch from network, cache it, return response
 */
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);

    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        console.log('[MediaCacheSW] Cache HIT:', request.url.substring(0, 80));
        return cachedResponse;
    }

    // Not in cache - fetch from network
    console.log('[MediaCacheSW] Cache MISS, fetching:', request.url.substring(0, 80));
    try {
        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse.ok && networkResponse.status === 200) {
            // Clone the response because it can only be consumed once
            const responseToCache = networkResponse.clone();

            // Store in cache (async, don't block the response)
            cache.put(request, responseToCache).catch(err => {
                console.warn('[MediaCacheSW] Failed to cache:', err);
            });
        }

        return networkResponse;
    } catch (error) {
        console.error('[MediaCacheSW] Fetch failed:', error);
        // If we have a stale cache entry, return it
        const staleResponse = await cache.match(request);
        if (staleResponse) return staleResponse;

        throw error;
    }
}

// Listen for messages to manage cache
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_MEDIA_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[MediaCacheSW] Cache cleared');
            event.ports[0]?.postMessage({ status: 'cleared' });
        });
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        // Pre-cache specific URLs (useful for playlist content)
        const urls = event.data.urls || [];
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of urls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                        console.log('[MediaCacheSW] Pre-cached:', url.substring(0, 80));
                    }
                } catch (e) {
                    console.warn('[MediaCacheSW] Pre-cache failed for:', url);
                }
            }
            event.ports[0]?.postMessage({ status: 'cached', count: urls.length });
        });
    }

    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        caches.open(CACHE_NAME).then(async (cache) => {
            const keys = await cache.keys();
            let totalSize = 0;
            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.clone().blob();
                    totalSize += blob.size;
                }
            }
            event.ports[0]?.postMessage({
                status: 'stats',
                entries: keys.length,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            });
        });
    }
});
