// 喵掌櫃換匯：讓網頁版沒網路也能打開
// 改了 index.html 或圖片後，把下面的版本號加 1，手機就會抓新版
const CACHE = "meowfx-v1";
const FILES = ["/", "/index.html", "/cat-avatar.png", "/cat-lying.png", "/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // 匯率資料不經過這裡，由網頁自己記住
  if (req.mode === "navigate") {
    // 打開網頁：有網路用最新的，沒網路用存好的
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("/index.html", c)); return r; })
      .catch(() => caches.match("/index.html")));
    return;
  }
  // 圖片等檔案：先用存好的，同時在背景更新
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
