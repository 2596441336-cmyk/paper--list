/* 离线缓存：应用本身的文件先用缓存、后台更新；天气接口始终走网络。 */
const VERSION = 'paperlist-v2';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/store.js', 'js/icons.js', 'js/sound.js', 'js/weather.js', 'js/ics.js', 'js/destroy.js', 'js/dog.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('open-meteo') || url.hostname.includes('bigdatacloud')) return;
  const isFont = url.hostname.includes('fonts.g') || url.hostname.includes('jsdelivr');
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
