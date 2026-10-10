/*
 * DIP service worker — offline-first app shell with smart runtime caching.
 *
 * Strategies:
 *  - HTML navigations: network-first (fresh content when online), falling back
 *    to cache, then to /offline.html when both fail.
 *  - Static assets (JS/CSS/images/fonts): stale-while-revalidate.
 *  - Convex API traffic is NEVER cached (real-time data must not be stale).
 *
 * It also contains the push-notification handlers so the structure is
 * push-ready: a server can POST to push subscriptions once VAPID keys are
 * configured (see Settings → Notifications).
 */

const VERSION = "dip-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Precached app shell: the icon set, the offline screen and the manifest.
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Cache entries one-by-one so one failed asset cannot abort the install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove old-version caches.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          // Navigation preload unsupported — ignore.
        }
      }
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.png" ||
    url.pathname === "/logo.svg" ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API / backend traffic (Convex, auth, webhooks).
  if (url.origin === self.location.origin) {
    if (
      url.pathname.startsWith("/api/") ||
      url.hostname.endsWith(".convex.cloud") ||
      url.hostname.endsWith(".convex.site")
    ) {
      return;
    }
  } else {
    if (
      url.hostname.endsWith(".convex.cloud") ||
      url.hostname.endsWith(".convex.site")
    ) {
      return;
    }
  }

  // App pages (navigations): network-first with cache + offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = event.preloadResponse
            ? await event.preloadResponse
            : null;
          const response = preload || (await fetch(request));
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = (await cache.match(request)) || (await cache.match("/"));
          if (cached) return cached;
          const staticCache = await caches.open(STATIC_CACHE);
          const shell = (await staticCache.match("/")) || (await staticCache.match("/offline.html"));
          if (shell) return shell;
          return (
            (await caches.match("/offline.html")) ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && (response.ok || response.type === "opaque")) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);
        return cached || (await network) || Response.error();
      })(),
    );
  }
});

// ── Push notifications (structure ready; needs VAPID keys to go live) ──
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "DIP update", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "DIP update";
  const options = {
    body: payload.body || "You have a new update on your case.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-mono-512.png",
    tag: payload.tag || "dip-case-update",
    data: { url: payload.url || "/cases" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/cases";
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
