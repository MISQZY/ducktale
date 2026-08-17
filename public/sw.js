// Web Push service worker — plain JS, not bundled by Next.js. Served
// statically from /sw.js (root of public/), which gives it root scope so it
// can control the whole origin. See src/lib/push.ts for the server side and
// src/hooks/usePushSubscription.ts for how it's registered.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const url = data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Already looking at the exact page this push is about (a focused tab
      // open to that same URL) — showing an OS notification on top would
      // just be noise, same reasoning NotificationsContext.tsx suppresses
      // its own in-app toast for this case. Only WindowClient exposes
      // `focused`; the `"focused" in client` guard skips any other client
      // type that might show up here.
      const alreadyViewing = windowClients.some((client) => {
        if (!("focused" in client) || !client.focused) return false;
        try {
          return new URL(client.url).pathname === url;
        } catch {
          return false;
        }
      });
      if (alreadyViewing) return undefined;

      return self.registration.showNotification(data.title || "DuckTale", {
        body: data.body || "",
        icon: "/icons/logo.svg",
        data: { url },
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
