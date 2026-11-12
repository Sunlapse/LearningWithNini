/* Learn With Nini – first visit + nickname.
   1. First visit: one tap. Nini says hi and asks the grade (4 big buttons). On the homepage that tap starts
      a short first game right away (the 3-minute Quick Dash); on other pages it just saves the grade.
      No typing before playing.
   2. After the first finished round (any game, Daily Challenge, Quick Dash, Daily Read), kids without a nickname
      are asked: "Want your name on the leaderboard?" (at most twice, never twice on the same day). */
(function () {
  var PROFILE = "learningWithNiniProfileV1", DONE = "lwn-welcomed-v1", ASK = "lwn-name-ask-v1";
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (["privacy.html", "parents-teachers.html", "account.html", "unsubscribe.html"].indexOf(page) >= 0) return;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function profile() { try { return JSON.parse(get(PROFILE) || "null"); } catch (e) { return null; } }
  function hasNickname() { var p = profile(); return !!(p && String(p.name || "").trim() && String(p.name).trim().toLowerCase() !== "nini"); }
  function hst() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu" }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function track(ev, d) { try { if (window.LWNStats) LWNStats.track(ev, d || null); } catch (e) {} }
  function say(text) {
    try { var u = new SpeechSynthesisUtterance(text); u.rate = 0.92; u.lang = "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  function busy() { return !!document.querySelector("#lwnWelcome,#lwnProfile,#lwnNicknameOverlay,#lwnRetainAsk,#lwnNameAsk,.lwn-modal,#lwnPiece,#lwnEvAnnounce,#lwnXPSheet"); }

  function css() {
    if (document.getElementById("lwn-welcome-css")) return;
    var s = document.createElement("style"); s.id = "lwn-welcome-css";
    s.textContent =
      "#lwnWelcome,#lwnNameAsk{position:fixed;inset:0;z-index:2147483600;background:rgba(27,51,80,.45);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
      "#lwnWelcome .card,#lwnNameAsk .card{width:min(440px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:28px;padding:22px 20px 16px;box-shadow:0 28px 70px rgba(29,59,96,.3);color:#203D61;text-align:center;animation:lwnIn .35s ease-out;position:relative}" +
      "#lwnWelcome img,#lwnNameAsk img{display:block;width:104px;height:104px;border-radius:50%;border:4px solid #F5633E;margin:0 auto}" +
      "#lwnWelcome h2,#lwnNameAsk h2{font:700 30px/1.1 'Fredoka',system-ui,sans-serif;color:#3574c1;margin:10px 0 4px}" +
      "#lwnWelcome p,#lwnNameAsk p{margin:0 0 14px;color:#5f587a;font-weight:800;font-size:18px;line-height:1.35}" +
      "#lwnWelcome .q{font:700 22px/1.2 'Fredoka',system-ui,sans-serif;color:#203D61;margin:6px 0 10px}" +
      "#lwnWelcome .gr{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
      "#lwnWelcome .gr button{min-height:76px;border:0;border-radius:20px;color:#fff;cursor:pointer;font:700 26px/1 'Fredoka',system-ui,sans-serif;box-shadow:0 5px 0 rgba(0,0,0,.18)}" +
      "#lwnWelcome .gr button small{display:block;font-size:15px;opacity:.95;margin-top:4px}" +
      "#lwnWelcome .gr button:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.18)}" +
      "#lwnWelcome .spk,#lwnNameAsk .spk{position:absolute;top:12px;right:12px;width:48px;height:48px;border-radius:50%;border:2px solid #E1EAF6;background:#F4F8FF;font-size:22px;cursor:pointer}" +
      "#lwnWelcome .later,#lwnNameAsk .later{display:block;width:100%;margin-top:10px;border:0;background:none;color:#72688c;font-weight:900;font-size:15px;padding:10px;cursor:pointer}" +
      "#lwnWelcome .grown{display:block;margin-top:2px;font-weight:900;font-size:13px;color:#3574c1}" +
      "#lwnNameAsk .go{width:100%;border:0;border-radius:18px;padding:16px;background:linear-gradient(135deg,#45b8ed,#478add);color:#fff;font:700 22px/1 'Fredoka',sans-serif;cursor:pointer;box-shadow:0 5px 0 #2F72C4}" +
      "@keyframes lwnIn{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}";
    document.head.appendChild(s);
  }

  /* ---------- 1. first visit: one tap ---------- */
  var HELLO = "Hi! I'm Nini! Let's play a quick math game together. What grade are you in?";
  function firstVisit() {
    if (document.getElementById("lwnWelcome") || document.getElementById("lwnNicknameOverlay")) return;
    css();
    var colors = { 2: "#FF8A5B", 3: "#3CC48D", 4: "#2BB3E8", 5: "#B06CE8" };
    var w = document.createElement("div"); w.id = "lwnWelcome";
    w.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="lwnWTitle">' +
      ('speechSynthesis' in window ? '<button type="button" class="spk" aria-label="Read this to me">🔊</button>' : "") +
      '<img src="/nini-face.webp" alt="Nini">' +
      '<h2 id="lwnWTitle">Hi! I’m Nini 👋</h2>' +
      "<p>Let’s play a quick math game together!</p>" +
      '<div class="q">What grade are you in?</div><div class="gr">' +
      ["2", "3", "4", "5"].map(function (g) { return '<button type="button" data-g="' + g + '" style="background:' + colors[g] + '">' + g + "<small>grade</small></button>"; }).join("") + "</div>" +
      '<button type="button" class="later">I just want to look around</button>' +
      '<a class="grown" href="/account.html">👤 Grown-ups: save progress with a free account →</a></div>';
    document.body.appendChild(w);
    var spk = w.querySelector(".spk"); if (spk) spk.onclick = function () { say(HELLO); };
    w.querySelectorAll("[data-g]").forEach(function (b) {
      b.onclick = function () {
        var g = b.dataset.g;
        try { var s2 = JSON.parse(get("dm-settings") || "{}"); s2.grade = g; set("dm-settings", JSON.stringify(s2)); } catch (e) {}
        set(DONE, "1"); track("welcome_grade", { grade: g, page: page });
        try { speechSynthesis.cancel(); } catch (e) {}
        if (page === "index.html" || page === "") { location.href = "/daily-challenge.html?start=dash"; return; }
        w.remove();
        // pages that read the grade when they load
        if (page === "daily-challenge.html" || page === "reading.html") location.reload();
      };
    });
    w.querySelector(".later").onclick = function () { set(DONE, "1"); track("welcome_later"); try { speechSynthesis.cancel(); } catch (e) {} w.remove(); };
  }

  /* ---------- 2. after the first finished round: nickname ---------- */
  function askState() { try { return JSON.parse(get(ASK) || "{}") || {}; } catch (e) { return {}; } }
  function canAsk() { var a = askState(); return !hasNickname() && (a.n || 0) < 2 && a.d !== hst(); }
  var asking = false;
  function nameAsk() {
    if (asking || !canAsk()) return;
    asking = true;
    var tries = 0, free = 0;
    (function wait() {
      // let the results, puzzle piece and XP celebrations finish first (two quiet checks in a row)
      free = busy() ? 0 : free + 1;
      if (free < 2 && tries++ < 30) return setTimeout(wait, 1500);
      if (!canAsk()) { asking = false; return; }
      var a = askState(); a.n = (a.n || 0) + 1; a.d = hst(); set(ASK, JSON.stringify(a));
      css();
      var w = document.createElement("div"); w.id = "lwnNameAsk";
      w.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="lwnNTitle">' +
        ('speechSynthesis' in window ? '<button type="button" class="spk" aria-label="Read this to me">🔊</button>' : "") +
        '<img src="/nini-face.webp" alt="Nini">' +
        '<h2 id="lwnNTitle">Awesome job! 🎉</h2>' +
        "<p>Want your name on the leaderboard? Pick a fun nickname and an icon!</p>" +
        '<button type="button" class="go">✏️ Pick my nickname</button>' +
        '<button type="button" class="later">Not now</button></div>';
      document.body.appendChild(w);
      var spk = w.querySelector(".spk"); if (spk) spk.onclick = function () { say("Awesome job! Want your name on the leaderboard? Pick a fun nickname and an icon!"); };
      track("name_ask", { n: a.n, page: page });
      w.querySelector(".later").onclick = function () { w.remove(); asking = false; };
      w.querySelector(".go").onclick = function () {
        w.remove(); asking = false;
        if (window.LWNProfile && LWNProfile.open) {
          // no page reload: the results the kid is looking at stay on screen
          LWNProfile.open({ onSave: function (p) {
            set(DONE, "1"); track("name_set", { page: page });
            try { window.dispatchEvent(new CustomEvent("lwn:profile", { detail: p })); } catch (e) {}
            try { if (p && p.avatar) window.dispatchEvent(new CustomEvent("lwn:icon", { detail: { to: p.avatar } })); } catch (e) {}
          } });
        }
      };
    })();
  }
  function soon() { setTimeout(nameAsk, 4000); }
  window.addEventListener("lwn:round-done", soon);
  function watchResults() {
    // Daily Challenge / Quick Dash results screen
    var done = document.getElementById("done");
    if (done && page === "daily-challenge.html") new MutationObserver(function () { if (done.classList.contains("on")) soon(); }).observe(done, { attributes: true, attributeFilter: ["class"] });
  }

  function start() {
    watchResults();
    if (!get(DONE) && !hasNickname()) setTimeout(firstVisit, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
