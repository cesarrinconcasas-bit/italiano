// Guarda la app en el dispositivo para que abra sin internet. Cambia VERSION al publicar cambios.
// Las cachés se comparten con otras apps del mismo dominio (p. ej. la de inglés):
// por eso todas llevan el prefijo PREFIX y solo se borran las propias.
const PREFIX = 'italiano-cesar-';
const VERSION = PREFIX + 'v1-2026-10-05';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/ui.js', 'js/store.js', 'js/srs.js', 'js/check.js', 'js/exercises.js', 'js/common.js',
  'js/speech.js', 'js/recorder.js', 'js/audiodb.js',
  'js/data/lessons.js', 'js/data/plan.js', 'js/data/week1.js', 'js/data/week2.js', 'js/data/week3.js', 'js/data/week4.js', 'js/data/week5.js', 'js/data/week6.js',
  'js/views/home.js', 'js/views/lessons.js', 'js/views/lesson.js', 'js/views/review.js',
  'js/views/progress.js', 'js/views/audios.js', 'js/views/more.js',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Primero la red (para recibir actualizaciones); si no hay internet, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.open(VERSION)
        .then((c) => c.match(e.request, { ignoreSearch: true }).then((r) => r || c.match('index.html')))),
  );
});
