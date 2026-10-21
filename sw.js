// Learn With Nini – service worker (lets the app open fast and work offline)
// Bump this number any time you change the site so the iPad gets the new version.
const CACHE = "nini-v32";

// Pages/files saved for offline use. Add new game pages here.
const PRECACHE = [
  "/",
  "/manifest.json",
  "/install-banner.js",
  "/badges.js",
  "/fun.js",
  "/xp.js",
  "/welcome.js",
  "/account.js",
  "/stats.js",
  "/profile.js",
  "/rewards.js",
  "/boss.html",
  "/account.html",
  "/game-ux.js",
  "/path.html",
  "/nini-face.webp",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/mobile-touch.css",
  "/game-round-ui.js",
  "/games-registry.js",
  "/fraction-lessons.js",
  "/nini-hero.webp",
  "/adv-hawaii.webp",
  "/adv-alaska.webp",
  "/adv-china.webp",
  "/adv-italy.webp",
  "/nini-mini.webp",
  "/capacity-lab.html",
  "/daily-challenge.html",
  "/division-dash.html",
  "/fraction-builder.html",
  "/games.html",
  "/geometry-builder.html",
  "/index.html",
  "/leaderboard.html",
  "/length-lab.html",
  "/math-detective.html",
  "/math-maze.html",
  "/money-match.html",
  "/multiplication-sprint.html",
  "/number-battle.html",
  "/parents-teachers.html",
  "/place-value-challenge.html",
  "/privacy.html",
  "/time-match.html",
  "/weight-mass-lab.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first (always fresh when online), fall back to saved copy when offline.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  );
});
