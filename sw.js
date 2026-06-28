const CACHE = 'streamtoday-v7.0.7';
const ASSETS = [
  '/',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // stream URLs কে bypass করো
  if (
    e.request.url.includes('stream') ||
    e.request.url.includes('zeno') ||
    e.request.url.includes('shoutca') ||
    e.request.url.includes('firebase') ||
    e.request.url.includes('googleapis.com')
  ) {
    return;
  }

  // same-origin assets: cache-first
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        // dynamic assets ও cache এ রাখো
        return caches.open(CACHE).then(cache => {
          cache.put(e.request, res.clone());
          return res;
        });
      }))
    );
    return;
  }

  // cross-origin (fonts, CDN): network-first, fallback to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATION ──
self.addEventListener('push', e => {
  let data = { title: 'Stream Today', body: 'নতুন নোটিশ এসেছে', icon: './icons/icon-192x192.png' };
  try {
    if (e.data) data = Object.assign(data, e.data.json());
  } catch(_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || './icons/icon-192x192.png',
      badge: './icons/icon-192x192.png',
      tag:   'streamtoday-notice',
      renotify: true,
      data:  { url: data.url || '/' }
    })
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
