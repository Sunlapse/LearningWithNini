/* Learn With Nini – XP, daily goal ring and weekly leagues.
   XP is saved on this device. Leagues use the public Daily Challenge leaderboard (Monday–Sunday, Hawaiʻi time). */
(function () {
  if (window.LWNXP) return;
  var KEY = "lwn-xp-v1";
  var GOALS = [{ xp: 20, label: "Casual" }, { xp: 30, label: "Regular" }, { xp: 50, label: "Serious" }, { xp: 80, label: "Intense" }];
  var LEAGUES = [
    { name: "Diamond", icon: "💎", min: 300, color: "#1E88E5" },
    { name: "Gold", icon: "🥇", min: 150, color: "#E2A400" },
    { name: "Silver", icon: "🥈", min: 60, color: "#8A94A6" },
    { name: "Bronze", icon: "🥉", min: 0, color: "#C0763A" }
  ];

  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s === "object") return s; } catch (e) {} return {}; }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function st() { var s = load(); s.days = s.days || {}; s.last = s.last || {}; s.games = s.games || {}; s.dailyDone = s.dailyDone || 0; s.goal = s.goal || 30; s.goalDays = s.goalDays || []; return s; }
  function today() {
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date()).forEach(function (x) { if (x.type !== "literal") p[x.type] = x.value; });
    return p.year + "-" + p.month + "-" + p.day;
  }
  function shift(d, n) { var x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function monday(d) { var x = new Date(d + "T12:00:00Z"), wd = (x.getUTCDay() + 6) % 7; return shift(d, -wd); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function myName() {
    try { var p = JSON.parse(localStorage.getItem("learningWithNiniProfileV1") || "null"); if (p && p.name && p.name.trim()) return p.name.trim(); } catch (e) {}
    try { var a = localStorage.getItem("dm-anon-name"); if (a) return a; } catch (e) {}
    return "";
  }

  /* ---------- earning XP ---------- */
  function add(xp, why) {
    xp = Math.max(0, Math.round(xp)); if (!xp) return;
    var s = st(), d = today(), before = s.days[d] || 0;
    s.days[d] = before + xp;
    var reached = before < s.goal && s.days[d] >= s.goal;
    if (reached && s.goalDays.indexOf(d) < 0) s.goalDays.push(d);
    // keep ~60 days of history
    Object.keys(s.days).sort().slice(0, -60).forEach(function (k) { delete s.days[k]; });
    save(s);
    paint(); toast("+" + xp + " XP" + (why ? " · " + why : ""));
    if (reached) goalReached();
  }
  // Every game already saves its running score; XP is the gain since the last save for that game and level.
  function fromScore(p) {
    if (!p || !p.game) return;
    var s = st(), key = p.game + "|" + (p.level == null ? "" : p.level), score = Number(p.score) || 0;
    var prev = s.last[key]; var gain;
    if (prev == null) gain = score; else if (score > prev) gain = score - prev; else if (score < prev) gain = score; else gain = 0;
    s.last[key] = score;
    var keys = Object.keys(s.last); if (keys.length > 300) keys.slice(0, keys.length - 300).forEach(function (k) { delete s.last[k]; });
    save(s);
    var earned;
    if (p.game === "daily_challenge") {
      var first = prev == null;
      earned = Math.min(gain, 60) + (first ? 10 : 0);
      if (first) s.dailyDone += 1;
    } else {
      earned = Math.min(gain, 15);
    }
    // per-game totals feed the learning path
    s.games[p.game] = (s.games[p.game] || 0) + Math.max(0, Math.round(earned));
    save(s);
    add(earned, p.game === "daily_challenge" && prev == null ? "challenge bonus" : "");
  }
  function hook() {
    var L = window.LWNLeaderboard;
    if (!L || L.__xpHooked || typeof L.saveScore !== "function") return false;
    var orig = L.saveScore;
    L.saveScore = function (payload) { try { fromScore(payload); } catch (e) {} return orig.apply(this, arguments); };
    L.__xpHooked = true; return true;
  }

  /* ---------- ring + panel ---------- */
  function css() {
    if (document.getElementById("lwn-xp-css")) return;
    var s = document.createElement("style"); s.id = "lwn-xp-css";
    s.textContent =
      "#lwnXP{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:55;width:58px;height:58px;border:0;border-radius:50%;background:#fff;" +
      "box-shadow:0 6px 18px rgba(40,76,120,.25);padding:0;cursor:pointer;display:grid;place-items:center}" +
      "#lwnXP svg{position:absolute;inset:0}#lwnXP b{position:relative;font:700 15px/1 'Fredoka','Nunito',system-ui,sans-serif;color:#284C79}" +
      "#lwnXP small{position:relative;display:block;font:900 9px/1 'Nunito',system-ui,sans-serif;color:#8A8199;margin-top:2px}" +
      "#lwnXP.full{box-shadow:0 0 0 4px #FFE58A,0 6px 18px rgba(40,76,120,.25)}" +
      "body.lwn-xp-hide #lwnXP{display:none}" +
      "#lwnXPToast{position:fixed;left:12px;bottom:calc(80px + env(safe-area-inset-bottom,0px));z-index:2147482999;background:#284C79;color:#fff;font:800 14px/1 'Nunito',system-ui,sans-serif;" +
      "padding:9px 12px;border-radius:999px;opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .2s;pointer-events:none;transform:translateY(6px)}" +
      "#lwnXPToast.on{opacity:1;transform:none}" +
      "#lwnXPSheet{position:fixed;inset:0;z-index:2147483000;background:rgba(20,38,60,.35);display:none;align-items:flex-end;justify-content:center}" +
      "#lwnXPSheet.on{display:flex}" +
      "#lwnXPSheet .card{background:#fff;width:min(520px,100%);max-height:88vh;overflow:auto;border-radius:24px 24px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));" +
      "font-family:'Nunito',system-ui,sans-serif;color:#1d3c63}" +
      "#lwnXPSheet h2{font:700 22px/1.1 'Fredoka',system-ui,sans-serif;margin:0 0 4px;color:#3271BD}" +
      "#lwnXPSheet h3{font:700 17px/1.1 'Fredoka',system-ui,sans-serif;margin:16px 0 8px;color:#284C79}" +
      "#lwnXPSheet .x{float:right;border:0;background:#F2F5F8;border-radius:50%;width:34px;height:34px;font-size:18px;cursor:pointer}" +
      "#lwnXPSheet .goals{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}" +
      "#lwnXPSheet .goals button{border:2px solid #DFE9F5;background:#fff;border-radius:14px;padding:8px 2px;font:800 12px/1.2 'Nunito',sans-serif;color:#284C79;cursor:pointer}" +
      "#lwnXPSheet .goals button b{display:block;font:700 17px/1.1 'Fredoka',sans-serif}" +
      "#lwnXPSheet .goals button[aria-pressed=true]{border-color:#468ADE;background:#ECF5FF}" +
      "#lwnXPSheet .week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;font-weight:900;color:#8A8199}" +
      "#lwnXPSheet .week i{display:block;height:46px;background:#F2F5F8;border-radius:10px;position:relative;overflow:hidden;margin-bottom:3px}" +
      "#lwnXPSheet .week i span{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#44B8EE,#468ADE)}" +
      "#lwnXPSheet .league{border-radius:18px;padding:12px;background:#FBF9FF;border:2px solid #DFE9F5}" +
      "#lwnXPSheet .league .tier{font:700 20px/1.1 'Fredoka',sans-serif}" +
      "#lwnXPSheet .league ol{margin:10px 0 0;padding:0;list-style:none}" +
      "#lwnXPSheet .league li{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:10px;font-weight:800;font-size:14px}" +
      "#lwnXPSheet .league li.me{background:#FFFBF0}" +
      "#lwnXPSheet .league li .n{width:22px;color:#8A8199}#lwnXPSheet .league li .p{margin-left:auto;font-family:'Fredoka',sans-serif}" +
      "#lwnXPSheet .muted{color:#7A718D;font-size:13px;font-weight:700}";
    document.head.appendChild(s);
  }
  function ringSVG(frac, full) {
    var r = 25, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    return '<svg viewBox="0 0 58 58" width="58" height="58" aria-hidden="true">' +
      '<circle cx="29" cy="29" r="' + r + '" fill="none" stroke="#E8F0FA" stroke-width="6"/>' +
      '<circle cx="29" cy="29" r="' + r + '" fill="none" stroke="' + (full ? "#F7B500" : "url(#lwnG)") + '" stroke-width="6" stroke-linecap="round"' +
      ' stroke-dasharray="' + (c * f).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 29 29)"/>' +
      '<defs><linearGradient id="lwnG" x1="0" x2="1"><stop offset="0" stop-color="#F0785A"/><stop offset="1" stop-color="#468ADE"/></linearGradient></defs></svg>';
  }
  function paint() {
    var b = document.getElementById("lwnXP"); if (!b) return;
    var s = st(), xp = s.days[today()] || 0, full = xp >= s.goal;
    b.innerHTML = ringSVG(xp / s.goal, full) + "<div><b>" + (full ? "⭐" : xp) + "</b><small>" + (full ? "GOAL!" : "/" + s.goal + " XP") + "</small></div>";
    b.classList.toggle("full", full);
    b.setAttribute("aria-label", "Today's XP: " + xp + " of " + s.goal + ". Open XP and leagues");
  }
  var toastT;
  function toast(text) {
    css(); var t = document.getElementById("lwnXPToast");
    if (!t) { t = document.createElement("div"); t.id = "lwnXPToast"; t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 1600);
  }
  function goalReached() {
    setTimeout(function () {
      toast("🎯 Daily goal reached!");
      try { if (window.LWNFun) { LWNFun.play("badge"); LWNFun.confetti(120); LWNFun.say("Daily goal done! 🎯", 2400); } } catch (e) {}
    }, 1700);
  }

  function goalStreak(s) {
    var set = new Set(s.goalDays), d = today(), n = 0;
    if (!set.has(d)) d = shift(d, -1);
    while (set.has(d)) { n++; d = shift(d, -1); }
    return n;
  }

  function openSheet() {
    css();
    var sh = document.getElementById("lwnXPSheet");
    if (!sh) {
      sh = document.createElement("div"); sh.id = "lwnXPSheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true");
      sh.addEventListener("click", function (e) { if (e.target === sh || e.target.closest(".x")) sh.classList.remove("on"); });
      document.body.appendChild(sh);
    }
    var s = st(), d = today(), xp = s.days[d] || 0, mon = monday(d), max = s.goal, weekXP = 0, bars = "";
    for (var i = 0; i < 7; i++) { var k = shift(mon, i); max = Math.max(max, s.days[k] || 0); }
    for (var j = 0; j < 7; j++) {
      var key = shift(mon, j), v = s.days[key] || 0; weekXP += v;
      bars += "<div><i><span style='height:" + Math.round(v / max * 100) + "%'></span></i>" + "MTWTFSS"[j] + "</div>";
    }
    var gs = goalStreak(s);
    sh.innerHTML = '<div class="card"><button class="x" aria-label="Close">×</button>' +
      "<h2>⚡ " + xp + " XP today</h2><div class='muted'>Daily goal: " + s.goal + " XP" +
      (xp >= s.goal ? " — done! 🎉" : " — " + (s.goal - xp) + " to go") + (gs ? " · 🎯 " + gs + "-day goal streak" : "") + "</div>" +
      "<h3>This week · " + weekXP + " XP</h3><div class='week'>" + bars + "</div>" +
      "<h3>Daily goal</h3><div class='goals'>" + GOALS.map(function (g) {
        return '<button type="button" data-goal="' + g.xp + '" aria-pressed="' + (g.xp === s.goal) + '"><b>' + g.xp + "</b>" + g.label + "</button>";
      }).join("") + "</div>" +
      "<a href='/path.html' style='display:block;text-align:center;margin-top:14px;padding:12px;border-radius:16px;background:linear-gradient(135deg,#44B8EE,#468ADE);color:#fff;font:700 17px/1.1 Fredoka,sans-serif;text-decoration:none'>🗺️ Open my learning path</a>" +
      "<a href='/account.html' style='display:block;text-align:center;margin-top:8px;padding:11px;border-radius:16px;border:2px solid #DFE9F5;color:#3574c1;font:800 15px/1.1 Nunito,sans-serif;text-decoration:none'>👤 Parents: save progress to an account</a>" +
      "<h3>Weekly league</h3><div class='league' id='lwnLeague'><div class='muted'>Loading this week's league…</div></div>" +
      "<p class='muted' style='margin:12px 0 0'>Earn XP in every game. Leagues count Daily Challenge points from Monday to Sunday (Hawaiʻi time) and reset every Monday.</p></div>";
    sh.querySelectorAll("[data-goal]").forEach(function (b) {
      b.addEventListener("click", function () { var s2 = st(); s2.goal = Number(b.dataset.goal); save(s2); paint(); openSheet(); });
    });
    sh.classList.add("on");
    league().then(renderLeague).catch(function () {
      var el = document.getElementById("lwnLeague"); if (el) el.innerHTML = "<div class='muted'>League standings need an internet connection.</div>";
    });
  }

  /* ---------- weekly leagues (from Daily Challenge points) ---------- */
  function tierFor(points) { for (var i = 0; i < LEAGUES.length; i++) if (points >= LEAGUES[i].min) return LEAGUES[i]; return LEAGUES[LEAGUES.length - 1]; }
  function league() {
    if (!window.LWNLeaderboard || typeof LWNLeaderboard.dailyChallenge !== "function") return Promise.reject();
    var start = monday(today());
    return LWNLeaderboard.dailyChallenge({ activity: true, includeReview: false }).then(function (rows) {
      var byPlayer = {};
      rows.forEach(function (r) {
        if (!r.date || r.date < start) return;
        var k = String(r.name).trim().toLowerCase(); if (!k) return;
        var p = byPlayer[k] = byPlayer[k] || { name: r.name, avatar: r.avatar, days: {} };
        p.days[r.date] = Math.max(p.days[r.date] || 0, Number(r.score) || 0);
      });
      return Object.keys(byPlayer).map(function (k) {
        var p = byPlayer[k], pts = 0; Object.keys(p.days).forEach(function (d) { pts += p.days[d]; });
        return { name: p.name, avatar: p.avatar, points: Math.round(pts * 100) / 100, key: k };
      }).sort(function (a, b) { return b.points - a.points; });
    });
  }
  function renderLeague(players) {
    var el = document.getElementById("lwnLeague"); if (!el) return;
    var me = myName().toLowerCase(), mine = players.filter(function (p) { return p.key === me; })[0];
    var pts = mine ? mine.points : 0, tier = tierFor(pts), idx = LEAGUES.indexOf(tier), next = idx > 0 ? LEAGUES[idx - 1] : null;
    var group = players.filter(function (p) { return tierFor(p.points) === tier; });
    var rank = mine ? group.indexOf(mine) + 1 : 0;
    var head = "<div class='tier' style='color:" + tier.color + "'>" + tier.icon + " " + tier.name + " League</div>" +
      "<div class='muted'>" + (mine ? "You have " + pts + " points this week" + (rank ? " · #" + rank + " in " + tier.name : "") : "Finish a Daily Challenge this week to join") +
      (next ? " · " + Math.ceil(next.min - pts) + " more to reach " + next.icon + " " + next.name : " · Top league! 🏆") + "</div>";
    var list = group.slice(0, 8);
    if (mine && list.indexOf(mine) < 0) list.push(mine);
    el.innerHTML = head + (list.length ? "<ol>" + list.map(function (p) {
      return "<li class='" + (p === mine ? "me" : "") + "'><span class='n'>" + (group.indexOf(p) + 1) + "</span><span>" + esc(p.avatar || "⭐") + "</span><span>" +
        esc(p.name) + "</span><span class='p'>" + p.points + "</span></li>";
    }).join("") + "</ol>" : "<div class='muted' style='margin-top:8px'>No one in this league yet this week — be the first!</div>");
  }

  /* ---------- mount ---------- */
  function mount() {
    css();
    if (!document.getElementById("lwnXP")) {
      var b = document.createElement("button"); b.id = "lwnXP"; b.type = "button";
      b.addEventListener("click", openSheet);
      document.body.appendChild(b);
    }
    paint();
    // Hide the ring while a Daily Challenge round is on screen (it would sit on the Skip button).
    var game = document.getElementById("game");
    if (game) {
      var upd = function () { document.body.classList.toggle("lwn-xp-hide", game.classList.contains("on")); };
      new MutationObserver(upd).observe(game, { attributes: true, attributeFilter: ["class"] }); upd();
    }
  }

  window.LWNXP = { add: add, fromScore: fromScore, open: openSheet, state: st, today: function () { return st().days[today()] || 0; } };
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 40) clearInterval(t); }, 250); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
