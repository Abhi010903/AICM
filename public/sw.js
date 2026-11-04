// AICM Constituency Digital Twin - Service Worker v3
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `aicm-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `aicm-runtime-${CACHE_VERSION}`;
const EXPECTED_CACHES = [SHELL_CACHE, RUNTIME_CACHE];

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Explicitly scoped lookups restricted to AICM caches; never reads unrelated origin caches
async function matchAicmCache(request) {
  for (const cacheName of [RUNTIME_CACHE, SHELL_CACHE]) {
    try {
      const cache = await caches.open(cacheName);
      const match = await cache.match(request);
      if (match) return match;
    } catch (err) {
      console.warn(`[SW] Cache lookup failed in ${cacheName}:`, err);
    }
  }
  return null;
}

// Best-effort cache write to runtime cache; failures are caught and logged independently
// and never turn a successful network response into a failed request or offline fallback
async function putInRuntimeCache(request, response) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  } catch (err) {
    console.warn('[SW] Runtime cache write failed:', err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Strictly delete obsolete AICM caches without affecting other origin caches
          if (key.startsWith('aicm-') && !EXPECTED_CACHES.includes(key)) {
            console.log('[SW] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((k) => k.startsWith('aicm-')).map((k) => caches.delete(k))
        );
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass non-HTTP(S) schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Never cache or intercept dev tooling, webpack HMR, or hot updates
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.includes('hot-update') ||
    url.pathname.startsWith('/_next/static/development')
  ) {
    return;
  }

  // Live dynamic APIs bypass service worker completely - handled by native browser networking
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Navigation requests (HTML documents) - Network First with Cache Fallback
  // Cache writes are best-effort inside respondWith promise; storage errors never trigger offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            await putInRuntimeCache(event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          const cached = await matchAicmCache(event.request);
          if (cached) return cached;
          const fallback = await matchAicmCache('/');
          if (fallback) return fallback;
          return new Response('Offline: Content currently unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // 2. Next.js App Router client navigation / RSC payload requests - Network First
  // Best-effort cache writes; storage failures never turn successful RSC responses into offline errors
  const isRsc = url.searchParams.has('_rsc') || event.request.headers.get('RSC') === '1';
  if (isRsc) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            await putInRuntimeCache(event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          const cached = await matchAicmCache(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
    return;
  }

  // 3. Immutable hashed Next.js assets (_next/static/chunks, css, media) - Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cached = await matchAicmCache(event.request);
        if (cached) return cached;
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          await putInRuntimeCache(event.request, networkResponse);
        }
        return networkResponse;
      })()
    );
    return;
  }

  // 4. Other static assets (icons, manifest, images, fonts) - Stale-While-Revalidate
  // Synchronously extend worker lifetime via event.waitUntil() during initial event dispatch
  const revalidatePromise = (async () => {
    try {
      const networkResponse = await fetch(event.request);
      if (
        networkResponse &&
        networkResponse.status === 200 &&
        (networkResponse.type === 'basic' || networkResponse.type === 'cors')
      ) {
        await putInRuntimeCache(event.request, networkResponse);
      }
      return networkResponse;
    } catch {
      return null;
    }
  })();

  event.waitUntil(revalidatePromise);

  event.respondWith(
    (async () => {
      const cached = await matchAicmCache(event.request);
      if (cached) return cached;
      const networkResponse = await revalidatePromise;
      if (networkResponse) return networkResponse;
      return new Response('', { status: 404, statusText: 'Not Found' });
    })()
  );
});
