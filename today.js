/* Learn With Nini – "Today with Nini": one clear plan for the day on the homepage.
   Three things to do (Daily Challenge, any game, Daily Read), what each one earns, and one big
   "next" button. Also counts finished game rounds today (lwn-today-v1) on every page. */
(function () {
  if (window.LWNToday) return;
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hst() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu" }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- tracking (every page) ---------- */
  function rec() { var r = get("lwn-today-v1", {}) || {}; if (r.d !== hst()) r = { d: hst(), games: 0 }; return r; }
  window.addEventListener("lwn:round-done", function (e) {
    if (e && e.detail && e.detail.kind === "read") return; // the Daily Read is its own task
    var r = rec(); r.games = (r.games || 0) + 1; set("lwn-today-v1", r);
  });

  /* ---------- what's done today ---------- */
  function grade() { var g = String((get("dm-settings", {}) || {}).grade || ""); return ["2", "3", "4", "5"].indexOf(g) >= 0 ? g : "3"; }
  function status() {
    var d = hst(), log = get("dm-log", []) || [];
    var daily = log.some(function (x) { return x && x.date === d && !x.dash; });
    var dash = log.some(function (x) { return x && x.date === d && x.dash; });
    var games = (rec().games || 0) + (dash ? 1 : 0);
    var band = (grade() === "4" || grade() === "5") ? "g45" : "g23", story = null, read = false;
    try { if (window.LWN_STORY_FOR) { story = window.LWN_STORY_FOR(band, d); var rd = get("lwn-read-v1", {}) || {}; read = !!(rd.done || {})[band + ":" + story.id]; } } catch (e) {}
    var c = get("lwn-chest-v1", {}) || {};
    var chest = c.opened === d ? "opened" : c.ready === d ? "ready" : "locked";
    var ev = null; try { ev = window.LWNEvent && LWNEvent.current && LWNEvent.current(); } catch (e) {}
    return { daily: daily, game: games > 0, read: read, story: story, chest: chest,
      pieces: ev ? { got: ev.todayCount(), max: ev.PER_DAY, page: ev.EV.page || (ev.EV.id.indexOf("pumpkin") === 0 ? "/pumpkin-patch.html" : "/thanksgiving.html") } : null };
  }

  /* ---------- the card (homepage only) ---------- */
  function css() {
    if (document.getElementById("lwnTodayCss")) return;
    var s = document.createElement("style"); s.id = "lwnTodayCss";
    s.textContent =
      "#lwnToday{margin:14px 0 18px;background:linear-gradient(160deg,#FFFFFF,#F2F8FF);border:3px solid #CFE2FA;border-radius:26px;padding:16px;box-shadow:0 8px 0 #DCE9F8;font-family:'Nunito',system-ui,sans-serif;color:#1D3C63}" +
      "#lwnToday .th{display:flex;align-items:center;gap:12px}" +
      "#lwnToday .th img{width:58px;height:58px;border-radius:50%;border:3px solid #FFB25B;flex:none;object-fit:cover}" +
      "#lwnToday .th b{display:block;font:700 24px/1.1 'Fredoka',system-ui,sans-serif;color:#1E6FD9}" +
      "#lwnToday .th small{display:block;font-weight:800;color:#6E7A92;font-size:14px;margin-top:2px}" +
      "#lwnToday .cnt{margin-left:auto;flex:none;font:700 18px/1 'Fredoka',system-ui,sans-serif;color:#1F9D55;background:#E7F7EE;border-radius:999px;padding:8px 12px}" +
      "#lwnToday .bar{height:12px;border-radius:999px;background:#E3ECF7;margin:12px 0 10px;overflow:hidden}" +
      "#lwnToday .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3CC48D,#1F9D55);transition:width .6s}" +
      "#lwnToday .task{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 12px;margin-top:8px;border-radius:18px;border:2px solid #E3ECF7;background:#fff;text-decoration:none;color:inherit}" +
      "#lwnToday .task .ck{flex:none;width:34px;height:34px;border-radius:50%;border:3px solid #C9D9EE;display:grid;place-items:center;font-size:18px;color:#fff;font-weight:900}" +
      "#lwnToday .task .e{flex:none;font-size:30px;line-height:1}" +
      "#lwnToday .task .t{flex:1;min-width:0;font-weight:900;font-size:17px;line-height:1.2}" +
      "#lwnToday .task .t small{display:block;font-weight:800;font-size:13px;color:#6E7A92;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#lwnToday .task .go{flex:none;font:700 15px/1 'Fredoka',system-ui,sans-serif;color:#fff;background:#1E6FD9;border-radius:12px;padding:10px 12px}" +
      "#lwnToday .task.done{background:#F3FBF6;border-color:#BFE8D0}" +
      "#lwnToday .task.done .ck{background:#1F9D55;border-color:#1F9D55}" +
      "#lwnToday .task.done .go{background:none;color:#1F9D55;padding:10px 0}" +
      "#lwnToday .task.next{border-color:#1E6FD9;box-shadow:0 0 0 3px rgba(30,111,217,.15)}" +
      "#lwnToday .extra{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}" +
      "#lwnToday .extra>*{display:inline-flex;align-items:center;gap:6px;min-height:40px;border-radius:999px;padding:6px 12px;font-weight:900;font-size:14px;background:#FFF6E0;color:#7A4A1F;border:0;text-decoration:none}" +
      "#lwnToday .extra button{cursor:pointer;background:#FFD23F;color:#5A3A00;box-shadow:0 3px 0 #C99A00}" +
      "#lwnToday .big{display:block;margin-top:12px;text-align:center;text-decoration:none;color:#fff;background:linear-gradient(135deg,#FF9B45,#E8711A);border-radius:18px;padding:16px;font:700 22px/1.1 'Fredoka',system-ui,sans-serif;box-shadow:0 5px 0 #B9560F}" +
      "#lwnToday .perfect{margin-top:12px;text-align:center;background:#E7F7EE;border-radius:18px;padding:14px;font-weight:900;color:#17643A;line-height:1.4}" +
      "#lwnToday .perfect b{display:block;font:700 22px/1.2 'Fredoka',system-ui,sans-serif}" +
      "@media(max-width:420px){#lwnToday{padding:13px}#lwnToday .th b{font-size:21px}#lwnToday .th img{width:50px;height:50px}#lwnToday .task .t{font-size:16px}}" +
      ".lwn-today-on .daily-treasure-banner,.lwn-today-on #dailyReadBanner,.lwn-today-on #lwnCaseFab{display:none!important}";
    document.head.appendChild(s);
  }
  var shown = null;
  function render() {
    var host = document.getElementById("lwnToday"); if (!host) return;
    var s = status(), done = [s.daily, s.game, s.read].filter(Boolean).length;
    var nice = new Date(hst() + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
    var tasks = [
      { k: "daily", ok: s.daily, e: "🔥", t: "Daily Challenge", sub: "Grow your streak", href: "/daily-challenge.html", go: "Start" },
      { k: "game", ok: s.game, e: "🎮", t: "Play any game", sub: "Pick a topic you like", href: "#game-topics", go: "Play" },
      { k: "read", ok: s.read, e: "📖", t: "Daily Read", sub: s.story ? s.story.e + " " + s.story.t : "A new story every day", href: "/reading.html", go: "Read" }
    ];
    var next = tasks.filter(function (x) { return !x.ok; })[0];
    var h = '<div class="th"><img src="/nini-face.webp" alt=""><div><b>Today with Nini</b><small>' + esc(nice) + " · do all 3!</small></div>" +
      '<span class="cnt">' + done + " of 3 ✓</span></div>" +
      '<div class="bar"><i style="width:' + Math.round(done / 3 * 100) + '%"></i></div>' +
      tasks.map(function (x) {
        return '<a class="task' + (x.ok ? " done" : "") + (next && next.k === x.k ? " next" : "") + '" href="' + x.href + '" data-task="' + x.k + '">' +
          '<span class="ck">' + (x.ok ? "✓" : "") + '</span><span class="e">' + x.e + '</span><span class="t">' + esc(x.t) + "<small>" + esc(x.sub) + "</small></span>" +
          '<span class="go">' + (x.ok ? "Done!" : x.go + " →") + "</span></a>";
      }).join("");
    var extra = [];
    if (s.chest === "ready") extra.push('<button type="button" data-chest>🎁 Your treasure chest is ready! Open it</button>');
    else if (s.chest === "opened") extra.push("<span>🎁 Treasure chest opened ✓</span>");
    else extra.push("<span>🎁 Play anything to earn today’s treasure chest</span>");
    if (s.pieces) extra.push('<a href="' + s.pieces.page + '">🧩 Puzzle pieces today: ' + s.pieces.got + " of " + s.pieces.max + "</a>");
    h += '<div class="extra">' + extra.join("") + "</div>";
    if (next) h += '<a class="big" href="' + next.href + '" data-task="' + next.k + '">' + (done ? "Next: " : "Start: ") + esc(next.t) + " →</a>";
    else h += '<div class="perfect"><b>🌟 Perfect day!</b>You did all 3. Come back tomorrow for a new challenge and a new story!</div>';
    host.innerHTML = h;
    var cb = host.querySelector("[data-chest]");
    if (cb) cb.onclick = function () { try { if (window.LWNIcons && LWNIcons.openChest) LWNIcons.openChest(); } catch (e) {} setTimeout(render, 2500); };
    host.querySelectorAll('[href="#game-topics"]').forEach(function (a) {
      a.addEventListener("click", function (e) { var t = document.getElementById("game-topics"); if (!t) return; e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); });
    });
    if (shown == null) { shown = done; try { if (window.LWNStats) LWNStats.track("today_card", { done: done }); } catch (e) {} }
  }
  function mount() {
    if (page !== "index.html" && page !== "") return;
    var hero = document.querySelector("main .hero-wrap"); if (!hero || document.getElementById("lwnToday")) return;
    css();
    var box = document.createElement("section"); box.id = "lwnToday"; box.setAttribute("aria-label", "Today with Nini");
    hero.parentNode.insertBefore(box, hero);
    document.documentElement.classList.add("lwn-today-on");
    function go() { render(); }
    if (!window.LWN_STORY_FOR) { var sc = document.createElement("script"); sc.src = "/stories.js"; sc.onload = go; document.head.appendChild(sc); }
    render();
    // the puzzle hunt and treasure load a moment later; refresh when they change
    setTimeout(render, 1500);
    ["lwn:piece", "lwn:xp", "storage", "pageshow"].forEach(function (ev) { window.addEventListener(ev, function () { setTimeout(render, 300); }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  window.LWNToday = { status: status, render: render };
})();
