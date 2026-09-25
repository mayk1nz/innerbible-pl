// Service worker of the installed app. Deliberately minimal: pages always come from
// the network (so a new deploy shows up at once); only when the device is offline
// does a page navigation fall back to a small "no connection" page.
const CACHE = 'ib-offline-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)))
})

// Daily reminder (Perfil → Notificaciones). The server sends { title, body, url }.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Biblia Wewnętrzna', {
      body: data.body || 'Twój dzisiejszy krok czeka.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'recordatorio-diario',
      data: { url: data.url || '/start' },
    }),
  )
})

// Tapping the notification opens (or focuses) the app on the right page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/start'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate(url)
          return w.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
