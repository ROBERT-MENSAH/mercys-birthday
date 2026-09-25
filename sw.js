const CACHE_NAME = "mercy-story-v5";
const IMAGE_CACHE = "mercy-images-v5";

/* The shell is everything needed to render the first screen and the whole
   story structure offline. No video is listed here: the clips total ~33MB and
   must never be part of an install-time download. */
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/variables.css",
  "css/base.css",
  "css/components.css",
  "css/decorations.css",
  "css/sections.css",
  "css/responsive.css",
  "js/data.js",
  "js/media.js",
  "js/sound.js",
  "js/prologue.js",
  "js/main.js",
  "js/media-manifest.json",
  "assets/icons/app-icon-192.png",
  "assets/icons/app-icon-512.png",
  "assets/icons/apple-touch-icon.png"
];

/* Only the first-screen photograph is precached. Everything else is fetched
   on demand and then cached, so a second visit is fast without a large
   up-front download. */
const PRECACHE_IMAGES = [
  "assets/img/me-currently-640.webp"
];


self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // addAll is all-or-nothing: one missing file would abort the whole
      // install and leave the site with no offline support at all. Adding
      // individually keeps a single failure from being fatal.
      return Promise.all(APP_SHELL.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" })).catch(function () {
          return null;
        });
      }));
    }).then(function () {
      return caches.open(IMAGE_CACHE);
    }).then(function (cache) {
      return Promise.all(PRECACHE_IMAGES.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" })).catch(function () {
          return null;
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key === CACHE_NAME || key === IMAGE_CACHE) return null;
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Let the browser handle range requests normally; caching partial MP4
  // responses can make seeking and iPhone playback unreliable.
  if (url.pathname.indexOf("/assets/videos/") !== -1) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put("index.html", copy); });
        return response;
      }).catch(function () {
        return caches.match("index.html");
      })
    );
    return;
  }

  /* Photographs and video posters: cache-first. They are immutable, content
     addressed by filename, and a repeat visit should not re-download them. */
  if (url.pathname.indexOf("/assets/img/") !== -1) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
