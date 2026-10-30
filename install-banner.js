// Learn With Nini – "Add to Home Screen" banner for iPad/iPhone
// Shows a friendly tip on Apple devices in Safari, only if the site isn't already installed.
(function () {
  // XP ring, daily goal and weekly leagues on every page.
  if (!document.querySelector('script[src="/xp.js"]')) {
    var xs = document.createElement("script"); xs.src = "/xp.js"; xs.defer = true; document.head.appendChild(xs);
  }
  // Parent accounts: keeps progress synced for signed-in families.
  if (!document.querySelector('script[src="/account.js"]')) {
    var as = document.createElement("script"); as.src = "/account.js"; as.defer = true; document.head.appendChild(as);
  }
  // Game pages: level dropdown on phones + auto-advance after correct answers.
  if (document.querySelector('link[href*="mobile-touch.css"]') && !document.querySelector('script[src="/game-ux.js"]')) {
    var gs = document.createElement("script"); gs.src = "/game-ux.js"; gs.defer = true; document.head.appendChild(gs);
  }
  // Simple visit stats (no names, emails or IP addresses).
  if (!document.querySelector('script[src="/stats.js"]')) {
    var ss = document.createElement("script"); ss.src = "/stats.js"; ss.defer = true; document.head.appendChild(ss);
  }
  // Nickname + icon picker ("Change my icon").
  if (!document.querySelector('script[src="/profile.js"]')) {
    var ps = document.createElement("script"); ps.src = "/profile.js"; ps.defer = true; document.head.appendChild(ps);
  }
  // Treasure chest, collectible icons, Beat Nini, league recap.
  if (!document.querySelector('script[src="/rewards.js"]')) {
    var rs = document.createElement("script"); rs.src = "/rewards.js"; rs.defer = true; document.head.appendChild(rs);
  }
  // Seasonal puzzle event (Thanksgiving Puzzle Hunt) + costume icons.
  if (!document.querySelector('script[src^="/event.js"]')) {
    var es = document.createElement("script"); es.src = "/event.js?v=3"; es.defer = true; document.head.appendChild(es);
  }
  // First-visit welcome: nickname, icon and grade.
  if (!document.querySelector('script[src="/welcome.js"]')) {
    var ws = document.createElement("script"); ws.src = "/welcome.js"; ws.defer = true; document.head.appendChild(ws);
  }
  // Welcome-back card and grown-up email invites.
  if (!document.querySelector('script[src="/retain.js"]')) {
    var rt = document.createElement("script"); rt.src = "/retain.js"; rt.defer = true; document.head.appendChild(rt);
  }
  // A clear 🏠 Home button on pages whose header only has the logo (kids don't know the logo goes home)
  function homeButton() {
    var path = location.pathname.replace(/\/index\.html$/, "/");
    if (path === "/" || document.getElementById("lwnHome")) return;
    var brand = document.querySelector('header .brand[href="/"], header a.brand[href="/index.html"]');
    if (!brand || brand.parentNode.querySelector('a[href="/"]:not(.brand), a[href="index.html"]:not(.brand)')) return;
    var h = document.createElement("a"); h.id = "lwnHome"; h.href = "/"; h.setAttribute("aria-label", "Home");
    h.textContent = "🏠";
    h.style.cssText = "display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;height:44px;min-height:44px;border-radius:14px;background:#EEF5FF;font-size:22px;text-decoration:none;padding:0;margin-right:8px";
    var wrap = document.createElement("span"); wrap.style.cssText = "display:inline-flex;align-items:center;min-width:0";
    brand.parentNode.insertBefore(wrap, brand); wrap.appendChild(h); wrap.appendChild(brand);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", homeButton); else homeButton();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }

  var ua = navigator.userAgent;
  var isApple = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  var installed = window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  var dismissed = false;
  try { dismissed = localStorage.getItem("niniBannerClosed") === "1"; } catch (e) {}

  if (!isApple || installed || dismissed) return;

  var css = document.createElement("style");
  css.textContent =
    "#nini-install{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);" +
    "width:min(92vw,440px);background:#fff;color:#0b2a5b;border-radius:20px;" +
    "box-shadow:0 10px 30px rgba(245,99,62,.3);padding:14px 16px;display:flex;gap:12px;" +
    "align-items:center;font:15px/1.35 -apple-system,system-ui,sans-serif;z-index:99999}" +
    "#nini-install img{width:52px;height:52px;border-radius:12px;flex:none}" +
    "#nini-install b{display:block;font-size:16px;margin-bottom:2px}" +
    "#nini-install button{margin-left:auto;align-self:flex-start;border:0;background:none;" +
    "font-size:22px;line-height:1;color:#f5633e;cursor:pointer;padding:0 2px}";
  document.head.appendChild(css);

  var share =
    '<svg width="16" height="18" viewBox="0 0 16 20" style="vertical-align:-3px" fill="none" ' +
    'stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M8 13V1M4 5l4-4 4 4M5 8H2v11h12V8h-3"/></svg>';

  var box = document.createElement("div");
  box.id = "nini-install";
  box.innerHTML =
    '<img src="/icons/icon-192.png" alt="">' +
    "<div><b>Get the Learn With Nini app!</b>" +
    "Tap " + share + " then <b style=\"display:inline\">Add to Home Screen</b></div>" +
    '<button aria-label="Close">×</button>';
  box.querySelector("button").onclick = function () {
    box.remove();
    try { localStorage.setItem("niniBannerClosed", "1"); } catch (e) {}
  };

  window.addEventListener("load", function () {
    setTimeout(function () { if (!document.getElementById("lwnWelcome")) document.body.appendChild(box); }, 2500);
  });
})();
