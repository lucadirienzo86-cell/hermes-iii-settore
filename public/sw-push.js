// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/app/dashboard',
        ...data.data
      },
      actions: data.actions || [
        {
          action: 'open',
          title: 'Apri'
        },
        {
          action: 'close',
          title: 'Chiudi'
        }
      ],
      tag: data.tag || 'sonyc-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Sonyc', options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes('/app/') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
