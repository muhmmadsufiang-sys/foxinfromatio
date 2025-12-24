// Service Worker for Remote Desktop - Corrected Version
// File: service-worker.js

const CACHE_NAME = 'remote-desktop-v2';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all clients immediately
            self.clients.claim()
        ])
        .then(() => {
            console.log('[Service Worker] Activated successfully');
            return self.clients.matchAll();
        })
        .then(clients => {
            // Notify all pages
            clients.forEach(client => {
                client.postMessage({ 
                    type: 'SERVICE_WORKER_ACTIVATED',
                    message: 'Service Worker is ready'
                });
            });
        })
    );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome-extension
    if (event.request.method !== 'GET' || 
        event.request.url.startsWith('chrome-extension://') ||
        event.request.url.includes('sockjs-node')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch failed:', error);
                        // You can return a custom offline page here
                        return new Response('Network error occurred', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// ========== MESSAGE HANDLING ==========
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (!event.data || !event.data.type) return;
    
    switch(event.data.type) {
        case 'KEEP_ALIVE':
            console.log('[Service Worker] Keep alive received');
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({ 
                    type: 'KEEP_ALIVE_RESPONSE', 
                    status: 'ALIVE',
                    timestamp: Date.now()
                });
            }
            break;
            
        case 'RELAY_SIGNALING':
            handleSignalingRelay(event);
            break;
            
        case 'CONNECTION_STATUS':
            handleConnectionStatus(event);
            break;
            
        case 'GET_CONNECTED_CLIENTS':
            getConnectedClients(event);
            break;
            
        case 'CLEAR_CACHE':
            clearCache(event);
            break;
            
        default:
            console.log('[Service Worker] Unknown message type:', event.data.type);
    }
});

// ========== CUSTOM FUNCTIONS ==========

// Handle signaling relay between clients
async function handleSignalingRelay(event) {
    try {
        const allClients = await self.clients.matchAll();
        const sourceClientId = event.source.id;
        
        console.log(`[Service Worker] Relaying signal from ${sourceClientId} to ${allClients.length - 1} clients`);
        
        allClients.forEach(client => {
            if (client.id !== sourceClientId) {
                client.postMessage({
                    type: 'SIGNALING_DATA',
                    from: sourceClientId,
                    data: event.data.payload,
                    timestamp: Date.now()
                });
            }
        });
        
        // Send acknowledgment back
        event.source.postMessage({
            type: 'SIGNALING_RELAYED',
            success: true,
            clientsCount: allClients.length - 1
        });
        
    } catch (error) {
        console.error('[Service Worker] Signaling relay failed:', error);
        event.source.postMessage({
            type: 'SIGNALING_RELAYED',
            success: false,
            error: error.message
        });
    }
}

// Handle connection status requests
async function handleConnectionStatus(event) {
    try {
        const allClients = await self.clients.matchAll();
        const status = {
            totalClients: allClients.length,
            clients: allClients.map(client => ({
                id: client.id,
                url: client.url,
                type: client.type,
                focused: client.focused || false
            })),
            timestamp: Date.now()
        };
        
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'CONNECTION_STATUS_RESPONSE',
                status: status
            });
        }
    } catch (error) {
        console.error('[Service Worker] Connection status failed:', error);
    }
}

// Get all connected clients
async function getConnectedClients(event) {
    try {
        const clients = await self.clients.matchAll({
            includeUncontrolled: true
        });
        
        const response = {
            count: clients.length,
            clients: clients.map(client => ({
                id: client.id,
                url: client.url
            }))
        };
        
        event.source.postMessage({
            type: 'CONNECTED_CLIENTS',
            data: response
        });
    } catch (error) {
        console.error('[Service Worker] Get clients failed:', error);
    }
}

// Clear cache
async function clearCache(event) {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        event.source.postMessage({
            type: 'CACHE_CLEARED',
            success: true
        });
    } catch (error) {
        console.error('[Service Worker] Clear cache failed:', error);
        event.source.postMessage({
            type: 'CACHE_CLEARED',
            success: false,
            error: error.message
        });
    }
}

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'background-connection') {
        event.waitUntil(maintainBackgroundConnection());
    }
});

async function maintainBackgroundConnection() {
    try {
        const clients = await self.clients.matchAll();
        console.log(`[Service Worker] Maintaining connection for ${clients.length} clients`);
        
        // Send ping to all clients
        clients.forEach(client => {
            client.postMessage({ 
                type: 'BACKGROUND_PING',
                timestamp: Date.now()
            });
        });
        
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Background sync failed:', error);
        return Promise.reject(error);
    }
}

// ========== PERIODIC BACKGROUND TASKS ==========
// Note: Service Workers can run periodic tasks in some browsers
// but background WebRTC streaming is not possible

// Heartbeat to keep service worker alive
setInterval(() => {
    console.log('[Service Worker] Heartbeat');
    // This helps prevent service worker from being terminated
}, 45000); // 45 seconds (less than 50s timeout)

// ========== PUSH NOTIFICATIONS (Optional) ==========
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'Remote Desktop Notification',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'remote-desktop',
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Remote Desktop', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' })
            .then(clientList => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow('/');
                }
            })
    );
});

// ========== ERROR HANDLING ==========
self.addEventListener('error', (error) => {
    console.error('[Service Worker] Error:', error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled rejection:', event.reason);
});

console.log('[Service Worker] Script loaded successfully');