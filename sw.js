// Picture to 3D - offline support. Bump VERSION when files change.
const VERSION = "p3d-v5";
const CORE = ["./", "index.html", "manifest.webmanifest", "vendor/three.module.js", "vendor/OrbitControls.js",
  "vendor/earcut.min.js", "vendor/clipper.js", "vendor/fflate.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const page = req.mode === "navigate" || url.pathname.endsWith("index.html");
  if (page) {   // network first so updates arrive; cache when offline
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(k => k.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // everything else (libraries, icons, Google fonts): cache first, fill cache as we go
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(k => k.put(req, c)); }
    return r;
  })));
});
