const CACHE = "ledger-v17";
const FILES = ["./", "./index.html", "./order.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (/script\.google|googleapis\.com|firebaseapp\.com|firebaseio\.com|identitytoolkit|securetoken/.test(e.request.url)) return;
  const sameSite = new URL(e.request.url).origin === location.origin;
  const isPage = e.request.mode === "navigate" || (sameSite && /\.(html|js|webmanifest)$|\/$/.test(new URL(e.request.url).pathname));
  if (isPage) {
    // App files: newest version from the internet first, saved copy only when offline.
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  // Fonts, icons, Firebase library: saved copy first (fast), refreshed in the background.
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
