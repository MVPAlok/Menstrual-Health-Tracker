self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/favicon.ico', // fallback icon in public
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          actionUrl: data.actionUrl || '/dashboard'
        },
        actions: [
          { action: 'open', title: 'Open LunaCare' },
          { action: 'later', title: 'Remind Me Later' }
        ]
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'LunaCare Update', options)
      );
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: '/favicon.ico',
        data: {
          actionUrl: '/dashboard'
        }
      };
      event.waitUntil(
        self.registration.showNotification('LunaCare Update', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'later') {
    console.log('User requested snooze / remind me later.');
    return;
  }
  
  const actionUrl = event.notification.data?.actionUrl || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(actionUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
