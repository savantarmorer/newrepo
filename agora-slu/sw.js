// Service Worker mínimo da Ágora (SLU) — cache do "app shell" estático
// (CSS, ícones, config, o helper de auth) para funcionar quase-offline.
// Nunca intercepta chamadas ao Supabase/Netlify Functions — dados sempre
// vêm da rede, só o esqueleto visual é cacheado.
const CACHE_NAME = 'agora-shell-v1';
const APP_SHELL = [
  'assets/cultus.css',
  'assets/seals.svg',
  'assets/icon.svg',
  'config.js',
  'js/agoraAuth.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {}) // não trava a instalação se algum asset falhar
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nomes =>
      Promise.all(nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Só cuida de pedidos do mesmo domínio; nunca intercepta Supabase,
  // Netlify Functions (/api/, /.netlify/) ou chamadas de outros domínios.
  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('/.netlify/functions/')) {
    return;
  }
  if (event.request.method !== 'GET') return;

  const éAppShell = APP_SHELL.some(caminho => url.pathname.endsWith(caminho));

  if (éAppShell) {
    // App shell: cache primeiro, rede como respaldo (atualiza o cache em segundo plano).
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else if (event.request.mode === 'navigate') {
    // Páginas HTML: rede primeiro (dados sempre atuais); se estiver
    // offline, cai pro que tiver em cache (se nunca visitou, falha normal).
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
