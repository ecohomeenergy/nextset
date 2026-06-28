// NextSet service worker — offline app shell.
// Bump CACHE on each deploy to force clients to refresh cached assets.
const CACHE = "nextset-v3";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Page loads: network-first so updates show when online, cache fallback at the gym.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(resp => { const c = resp.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return resp; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Everything else: cache-first.
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const c = resp.clone(); caches.open(CACHE).then(x => x.put(req, c)); return resp;
    }).catch(() => r))
  );
});
