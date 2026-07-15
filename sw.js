const CACHE_NAME = 'diario-bebe-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Instalação: Ocultar no fundo e guardar os ficheiros na memória (Cache)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Ativação: Limpar versões antigas de Cache caso o CACHE_NAME mude
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. Interceção de Rede (Estratégia: Stale-While-Revalidate)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Vai buscar à rede a versão mais recente em segundo plano
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Se estiver sem internet e não for possível atualizar, falha silenciosamente
                console.log("Modo Offline Ativo");
            });

            // Devolve imediatamente o que está no cache (rápido), ou espera pela rede
            return cachedResponse || fetchPromise;
        })
    );
});

// 4. Listener para Atualização Silenciosa (Forçar nova versão quando o utilizador aceitar)
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
