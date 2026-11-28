// Stickman Workshop: funciona sin internet. Cambia VERSION en cada actualización.
const VERSION = 'tp-v64';
const CORE = ['./', 'index.html', 'en.html', 'ja.html', 'zh.html', 'fr.html', 'manifest.webmanifest', 'privacidad.html', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== 'tp-ai').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // La página: primero internet (para recibir actualizaciones), si no hay, la copia guardada.
  if (req.mode === 'navigate') {
    const m = url.pathname.match(/(en|ja|zh|fr)\.html$/); const page = m ? m[1] + '.html' : 'index.html';
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(page, cp)); return r; })
      .catch(() => caches.match(page)));
    return;
  }
  // IA para quitar fondos: se baja una vez y queda guardada aparte (no se borra al actualizar).
  if (url.origin === location.origin && /\/ai\//.test(url.pathname)) {
    e.respondWith(caches.open('tp-ai').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // Lo demás (iconos, fuentes): la copia guardada primero, y se guarda lo nuevo.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
      return r;
    })));
  }
});
