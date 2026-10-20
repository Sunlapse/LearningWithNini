/* Learn With Nini – simple, privacy-friendly visit stats.
   Records which pages are opened, how long people stay, and game/challenge finishes.
   No names, emails or IP addresses: just a random visitor code kept in this browser,
   the device type, time zone and language. Nothing is shown publicly. */
(function () {
  if (window.LWNStats) return;
  var EP = "https://wvcdihtphcjuegdkadsb.supabase.co/rest/v1/site_events";
  var KEY = "sb_publishable_Uso8SKT30uVsIDPxTzroIQ_kMCWOoaN";
  if (!/learnwithnini\.com$/.test(location.hostname)) { window.LWNStats = { track: function () {} }; return; } // only the real site

  function vid() {
    try { var v = localStorage.getItem("lwn-vid"); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("lwn-vid", v); } return v; } catch (e) { return "na"; }
  }
  var page = location.pathname.replace(/\/index\.html$/, "/") || "/";
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  var ua = navigator.userAgent, w = Math.min(screen.width, screen.height);
  var device = (/iPad|Tablet/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? (w >= 600 ? "tablet" : "phone") : "computer") + (standalone ? " (app)" : "");
  var ref = ""; try { if (document.referrer) { var h = new URL(document.referrer).hostname; if (!/learnwithnini\.com$/.test(h)) ref = h; } } catch (e) {}
  var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var utm = ""; try { var sp = new URLSearchParams(location.search); utm = sp.get("utm_source") || sp.get("source") || ""; } catch (e) {}

  function send(event, detail, keepalive) {
    try {
      fetch(EP, { method: "POST", keepalive: !!keepalive, headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ visitor: vid(), event: event, page: page, ref: ref || null, device: device, tz: tz, lang: (navigator.language || "").slice(0, 12), detail: detail || null }) }).catch(function () {});
    } catch (e) {}
  }

  // 1. page view
  send("view", utm ? { source: utm } : null);

  // 2. how long they stayed (sent once when they leave or switch away)
  var t0 = Date.now(), sent = false;
  function leave() { if (sent) return; sent = true; send("leave", { secs: Math.round((Date.now() - t0) / 1000) }, true); }
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") leave(); });

  // 3. every saved score (games and the Daily Challenge)
  function hook() {
    var L = window.LWNLeaderboard; if (!L || L.__statsHooked || typeof L.saveScore !== "function") return !!(L && L.__statsHooked);
    var orig = L.saveScore;
    L.saveScore = function (p) {
      try { send(p && p.game === "daily_challenge" ? "daily_finish" : "score", { game: p && p.game, score: p && p.score, level: p && p.level }); } catch (e) {}
      return orig.apply(this, arguments);
    };
    L.__statsHooked = true; return true;
  }
  if (!hook()) { var n = 0, iv = setInterval(function () { if (hook() || ++n > 40) clearInterval(iv); }, 250); }

  // 4. Daily Challenge started (the round screen opens)
  function watchDaily() {
    var g = document.getElementById("game"); if (!g) return;
    var on = false;
    new MutationObserver(function () { var now = g.classList.contains("on"); if (now && !on) send("daily_start"); on = now; }).observe(g, { attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchDaily); else watchDaily();

  window.LWNStats = { track: send };
})();
