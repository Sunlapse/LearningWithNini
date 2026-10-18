// Learn With Nini – "Add to Home Screen" banner for iPad/iPhone
// Shows a friendly tip on Apple devices in Safari, only if the site isn't already installed.
(function () {
  // XP ring, daily goal and weekly leagues on every page.
  if (!document.querySelector('script[src="/xp.js"]')) {
    var xs = document.createElement("script"); xs.src = "/xp.js"; xs.defer = true; document.head.appendChild(xs);
  }
  // First-visit welcome: nickname, icon and grade.
  if (!document.querySelector('script[src="/welcome.js"]')) {
    var ws = document.createElement("script"); ws.src = "/welcome.js"; ws.defer = true; document.head.appendChild(ws);
  }
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
    "box-shadow:0 10px 30px rgba(245,62,140,.3);padding:14px 16px;display:flex;gap:12px;" +
    "align-items:center;font:15px/1.35 -apple-system,system-ui,sans-serif;z-index:99999}" +
    "#nini-install img{width:52px;height:52px;border-radius:12px;flex:none}" +
    "#nini-install b{display:block;font-size:16px;margin-bottom:2px}" +
    "#nini-install button{margin-left:auto;align-self:flex-start;border:0;background:none;" +
    "font-size:22px;line-height:1;color:#f53e8c;cursor:pointer;padding:0 2px}";
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
