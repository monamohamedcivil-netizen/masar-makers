/* Masar Makers admin — Web Push for the WhatsApp inbox */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Masar Makers", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "رسالة واتساب جديدة";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "wa",
      renotify: true,
      dir: "rtl",
      lang: "ar",
      icon: "/images/branding/masar-makers-email-logo.png",
      badge: "/images/branding/masar-makers-email-logo.png",
      data: { url: data.url || "/admin/whatsapp-inbox" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/admin/whatsapp-inbox", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes("/admin/whatsapp-inbox") && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
