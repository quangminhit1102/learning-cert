const VERSION = "2026-11-18-18";
const CACHE = "lc-static-" + VERSION;
const BOOK = "github-copilot-gh300/";
const CHAPTERS = [
  "ch01-overview.html",
  "ch02-responsible.html",
  "ch03-ide.html",
  "ch04-cli-advanced.html",
  "ch05-data-architecture.html",
  "ch06-prompt-engineering.html",
  "ch07-productivity.html",
  "ch08-privacy.html"
];

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "404.html",
  "assets/shell.css",
  "assets/shell.js",
  "assets/quiz.js",
  "assets/cards.js",
  "assets/diagrams.js",
  "assets/mock.js",
  "assets/pwa.js",
  "assets/firebase-config.js",
  "assets/sync.js",
  "assets/version.js",
  "assets/favicon.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/data/library.js",
  BOOK + "index.html",
  BOOK + "mock.html",
  BOOK + "wrong.html",
  BOOK + "data/book.js"
]
  .concat(CHAPTERS.map((file) => BOOK + "chapters/" + file))
  .concat(CHAPTERS.map((file, i) => BOOK + "data/ch" + String(i + 1).padStart(2, "0") + ".js"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => null)))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 503, statusText: "Offline" });
        });
    })
  );
});
