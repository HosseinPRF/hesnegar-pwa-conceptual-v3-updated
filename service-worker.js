const CACHE = 'hesnegar-v5';

// App Shell (فایل‌هایی که باید آفلاین هم همیشه در دسترس باشند)
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './achievements.html',
  './achievements.js',
  './principles.html',
  './principles.js',
  './improvements.html',
  './improvements.js'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  // فقط فایل‌های هم‌دامنه را مدیریت کن
  const sameOrigin = url.origin === location.origin;

  // صفحات (navigation): cache-first + بروزرسانی پس‌زمینه + fallback
  if(req.mode === 'navigate'){
    e.respondWith((async ()=>{
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then(net=>{
          if(net && net.ok) cache.put(req, net.clone());
          return net;
        })
        .catch(()=>null);

      return cached || (await fetchPromise) || (await cache.match('./index.html'));
    })());
    return;
  }

  // سایر فایل‌ها: stale-while-revalidate
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);

    const fetchPromise = (!sameOrigin || req.method !== 'GET') ? null : fetch(req)
      .then(net=>{
        if(net && net.ok) cache.put(req, net.clone());
        return net;
      })
      .catch(()=>null);

    return cached || (fetchPromise ? await fetchPromise : fetch(req));
  })());
});