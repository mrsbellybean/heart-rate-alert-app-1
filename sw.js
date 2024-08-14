self.addEventListener('push', function(event) {
    const data = event.data.json();
    const options = {
        body: data.notification.body,
        icon: data.notification.icon,
        vibrate: [200, 100, 200],
        badge: '/badge-icon.png',
        actions: [{ action: "view", title: "View Details", icon: "/icon-view.png" }]
    };

    event.waitUntil(
        self.registration.showNotification(data.notification.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Customize the URL to where the user should be directed
    );
});
