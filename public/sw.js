// Service Worker for Comunidade Fogueteiros PWA
// Strategy: network-first for HTML, cache-first for static assets

const CACHE_VERSION = 'v5'
const STATIC_CACHE = `cf-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `cf-runtime-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/#/labs',
  '/#/downloads',
  '/#/materiais',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] precache partial fail:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return  // skip cross-origin

  // Network-first for HTML
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Cache-first for static
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith('/icons/') ||
                       url.pathname.startsWith('/assets/') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.js'))) {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy))
        }
        return res
      }).catch(() => cached)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})
