// Permet à l'application de s'ouvrir sans internet.
// Changer CACHE (et APP_VERSION dans index.html) à chaque mise à jour.
const CACHE = 'magasin-pc-v19';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png', './logo.png', './logo-mark.png'];

self.addEventListener('install', e => {
  // cache:'reload' : on prend les fichiers sur le serveur, jamais une vieille copie du navigateur.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), sinon la copie gardée.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  // Pour nos fichiers, on redemande toujours au serveur s'il y a une nouvelle version (GitHub Pages les garde 10 min sinon).
  const req = same ? fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}) : fetch(e.request);
  e.respondWith(
    req.then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
