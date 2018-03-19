self.addEventListener("install", event => {
  console.log("Service worker installed");
});

self.addEventListener("push", function(event) {
  console.log("[Service Worker] Push Received.");
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let notification = JSON.parse(event.data.text());

  const title = notification.Primary_Subject;
  const options = {
    body: new Date(notification.Created_Datetime).toString(),
    data: notification.Id,
    icon: "images/icon.png",
    badge: "images/badge.png"
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function(event) {
  console.log("[Service Worker] Notification click Received.");
  
  let id = event.notification.data;

  event.notification.close();

  event.waitUntil(clients.openWindow("/notifications.html?id=".concat(id)));
});
