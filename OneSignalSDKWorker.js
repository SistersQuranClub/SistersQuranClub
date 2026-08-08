// OneSignal SDK (required)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'sqc-cache-v3';

// Install — skip waiting immediately
self.addEventListener('install', e => {
  self.skipWaiting();
});

// Activate — clear ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — NEVER cache HTML, always fetch fresh
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch HTML fresh from network — never cache it
  if (e.request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('<h1>You are offline</h1><p>Please connect to the internet.</p>',
          { headers: { 'Content-Type': 'text/html' } })
      )
    );
    return;
  }

  // Cache-first for static assets (fonts, images, JS, CSS)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
