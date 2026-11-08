/* Service worker: zorgt dat de app ook zonder internet werkt.
 * Strategie: eerst het netwerk proberen (zo komen updates vanzelf binnen), en als dat niet lukt de opgeslagen kopie gebruiken.
 * Verander VERSION als je nieuwe bestanden hebt gezet, dan wordt de oude opslag opgeruimd.
 */
const VERSION = 'word-arena-v3';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/figure.js', 'js/store.js', 'js/speech.js',
  'data/characters.json', 'data/units.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'images/groep.webp',
  'images/dahlia.webp', 'images/vera.webp', 'images/ivy.webp', 'images/nova.webp',
  'images/pas-dahlia.webp', 'images/pas-vera.webp', 'images/pas-ivy.webp', 'images/pas-nova.webp'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    try {                                   // ook alle unit-bestanden uit data/units.json
      const files = await (await fetch('data/units.json', { cache: 'no-store' })).json();
      await cache.addAll(files.map(f => 'data/' + f));
    } catch (e) { /* later opnieuw */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(req, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('index.html')) || (await cache.match('./'));
      throw err;
    }
  })());
});
