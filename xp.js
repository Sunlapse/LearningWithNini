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
    if (round.before == null) round.before = before;
    round.xp += xp;
    paint(); toast("+" + xp + " XP" + (why ? " · " + why : ""));
    try { window.dispatchEvent(new CustomEvent("lwn:xp", { detail: { xp: xp, why: why || "" } })); } catch (e) {}
    if (reached) goalReached();
  }
  // Every game already saves its running score; XP is the gain since the last save for that game and level.
  function fromScore(p) {
    if (!p || !p.game) return;
    if (/\|dash\|/.test(String(p.level || ""))) return; // league copy of a Quick Dash: its XP was already given
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
      "#lwnXPToast{position:fixed;left:78px;bottom:calc(26px + env(safe-area-inset-bottom,0px));z-index:2147482999;background:#284C79;color:#fff;font:800 14px/1 'Nunito',system-ui,sans-serif;" +
      "padding:9px 12px;border-radius:999px;opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .2s;pointer-events:none;transform:translateY(6px)}" +
      "#lwnXPToast.on{opacity:1;transform:none}" +
      "#lwnXPSheet{position:fixed;inset:0;z-index:2147483000;background:rgba(20,38,60,.35);display:none;align-items:flex-end;justify-content:center}" +
      "#lwnXPSheet.on{display:flex}" +
      "#lwnXPSheet .gbar{position:relative;height:34px;border-radius:999px;background:#E8F0FA;margin:12px 0 6px;box-shadow:inset 0 2px 4px rgba(30,70,120,.12)}" +
      "#lwnXPSheet .gbar .fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#45B8ED,#478ADD);transition:width .9s cubic-bezier(.2,.9,.3,1.2);overflow:hidden}" +
      "#lwnXPSheet .gbar .fill:after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);background-size:220% 100%;animation:lwnShine 2.2s linear infinite}" +
      "#lwnXPSheet .gbar.full .fill{background:linear-gradient(90deg,#FFC93C,#FF9F1C,#FF6B3D)}" +
      "#lwnXPSheet .gbar .lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 16px/1 'Fredoka',system-ui,sans-serif;color:#1d3c63;text-shadow:0 1px 0 rgba(255,255,255,.7);z-index:2}" +
      "#lwnXPSheet .gbar.full .lbl{color:#fff;text-shadow:0 1px 2px rgba(120,50,0,.45)}" +
      "#lwnXPSheet .gbar .tip{position:absolute;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(69,184,237,.35),0 0 16px 4px rgba(69,184,237,.55);display:grid;place-items:center;font-size:15px;z-index:3;animation:lwnPulse 1.4s ease-in-out infinite}" +
      "#lwnXPSheet .gbar.full .tip{width:40px;height:40px;margin:-20px 0 0 -26px;background:#FFF4CC;font-size:22px;box-shadow:0 0 0 4px rgba(255,159,28,.4),0 0 22px 8px rgba(255,170,40,.65)}" +
      "#lwnXPSheet .gbar .spark{position:absolute;top:50%;right:4px;z-index:3;pointer-events:none}" +
      "#lwnXPSheet .gbar .spark i{position:absolute;font-style:normal;font-size:15px;opacity:0;animation:lwnSpark 1.6s ease-out infinite}" +
      "#lwnXPSheet .gsub{display:flex;justify-content:space-between;font-weight:900;font-size:13px;color:#5E7896}#lwnXPSheet .gsub b{color:#E0602F}" +
      "#lwnXPSheet .week i span.hit{background:linear-gradient(180deg,#FFC93C,#FF9F1C)!important}" +
      "@keyframes lwnShine{from{background-position:120% 0}to{background-position:-120% 0}}" +
      "@keyframes lwnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}" +
      "@keyframes lwnSpark{0%{opacity:0;transform:translate(0,-50%) scale(.4)}25%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}}" +
      "@media (prefers-reduced-motion:reduce){#lwnXPSheet .gbar .fill:after,#lwnXPSheet .gbar .tip,#lwnXPSheet .gbar .spark i{animation:none}#lwnXPSheet .gbar .spark i{opacity:1}}" +
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
      "#lwnXPSheet .muted{color:#7A718D;font-size:13px;font-weight:700}" +
      "#lwnLeaguePanel .league{border-radius:22px;padding:16px;background:#fff;border:2px solid #DFE9F5;box-shadow:0 10px 24px rgba(40,76,120,.08)}" +
      "#lwnLeaguePanel .league .tier{font:700 24px/1.1 'Fredoka',sans-serif}" +
      "#lwnLeaguePanel .league ol{margin:12px 0 0;padding:0;list-style:none}" +
      "#lwnLeaguePanel .league li{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;font-weight:800;font-size:15px}" +
      "#lwnLeaguePanel .league li:nth-child(odd){background:#F7FAFE}#lwnLeaguePanel .league li.me{background:#FFF6D6}" +
      "#lwnLeaguePanel .league li .n{width:24px;color:#8A8199}#lwnLeaguePanel .league li .p{margin-left:auto;font-family:'Fredoka',sans-serif}" +
      "#lwnLeaguePanel .muted{color:#6B7392;font-size:14px;font-weight:700;margin-top:3px}" +
      "#lwnLeaguePanel .ladder{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 12px}" +
      "#lwnLeaguePanel .ladder div{text-align:center;background:#fff;border:2px solid #E3EEFA;border-radius:16px;padding:8px 4px;font:800 12px/1.2 'Nunito',sans-serif;color:#5B6688}" +
      "#lwnLeaguePanel .ladder div b{display:block;font:700 16px/1.2 'Fredoka',sans-serif;color:#24446c}#lwnLeaguePanel .ladder span{font-size:22px}" +
      "#lwnLeaguePanel .ladder div.on{border-color:#1E6FD9;background:#EAF3FF}";
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
    // Goal bar: fills toward the daily goal with a glowing tip; past the goal it turns gold and sparkles at the edge
    function goalBar(xp, goal) {
      var pct = Math.min(100, Math.round(xp / goal * 100)), full = xp >= goal;
      var sparks = full ? ["✨", "⭐", "💥", "✨", "🌟", "⭐"].map(function (e, i) {
        var a = (i / 6) * Math.PI * 2; return "<i style='--dx:" + Math.round(Math.cos(a) * 34) + "px;--dy:" + Math.round(Math.sin(a) * 26 - 12) + "px;animation-delay:" + (i * .25).toFixed(2) + "s'>" + e + "</i>";
      }).join("") : "";
      return "<div class='gbar" + (full ? " full" : "") + "' role='progressbar' aria-valuemin='0' aria-valuemax='" + goal + "' aria-valuenow='" + Math.min(xp, goal) + "' aria-label='Daily goal progress'>" +
        "<div class='fill' style='width:0%' data-w='" + pct + "'></div>" +
        "<div class='lbl' style='" + (full ? "" : pct < 60 ? "justify-content:flex-end;padding-right:16px" : "justify-content:flex-start;padding-left:16px;color:#fff;text-shadow:0 1px 2px rgba(0,40,90,.4)") + "'>" + xp + " / " + goal + " XP</div>" +
        (xp > 0 ? "<div class='tip' style='left:" + Math.max(4, pct) + "%'>" + (full ? "🏆" : "⚡") + "</div>" : "") +
        (full ? "<div class='spark'>" + sparks + "</div>" : "") + "</div>" +
        "<div class='gsub'><span>0</span>" + (full ? "<b>🎉 Goal smashed!" + (xp > goal ? " +" + (xp - goal) + " bonus XP" : "") + "</b>" : "<span>" + (goal - xp) + " XP to your goal</span>") + "<span>🎯 " + goal + "</span></div>";
    }
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
      bars += "<div><i><span" + (v >= s.goal ? " class='hit'" : "") + " style='height:" + Math.round(v / max * 100) + "%'></span></i>" + "MTWTFSS"[j] + "</div>";
    }
    var gs = goalStreak(s);
    sh.innerHTML = '<div class="card"><button class="x" aria-label="Close">×</button>' +
      "<h2>⚡ " + xp + " XP today</h2><div class='muted'>Daily goal: " + s.goal + " XP" +
      (xp >= s.goal ? " — done! 🎉" : " — " + (s.goal - xp) + " to go") + (gs ? " · 🎯 " + gs + "-day goal streak" : "") + "</div>" +
      goalBar(xp, s.goal) +
      "<h3>This week · " + weekXP + " XP</h3><div class='week'>" + bars + "</div>" +
      "<h3>Daily goal</h3><div class='goals'>" + GOALS.map(function (g) {
        return '<button type="button" data-goal="' + g.xp + '" aria-pressed="' + (g.xp === s.goal) + '"><b>' + g.xp + "</b>" + g.label + "</button>";
      }).join("") + "</div>" +
      "<a href='/path.html' style='display:block;text-align:center;margin-top:14px;padding:12px;border-radius:16px;background:linear-gradient(135deg,#44B8EE,#468ADE);color:#fff;font:700 17px/1.1 Fredoka,sans-serif;text-decoration:none'>🗺️ Open my learning path</a>" +
      "<a href='/account.html' style='display:block;text-align:center;margin-top:8px;padding:11px;border-radius:16px;border:2px solid #DFE9F5;color:#3574c1;font:800 15px/1.1 Nunito,sans-serif;text-decoration:none'>👤 Parents: save progress to an account</a>" +
      "<h3>Weekly league <span class='muted'>(Daily Challenge + Quick Dash)</span></h3><div class='league' id='lwnLeague'><div class='muted'>Loading this week's league…</div></div>" +
      "<p class='muted' style='margin:12px 0 0'>⚡ XP comes from every game and the Daily Challenge. Weekly leagues count your best Daily Challenge or Quick Dash each day, Monday to Sunday (Hawaiʻi time), and reset every Monday.</p></div>";
    sh.querySelectorAll("[data-goal]").forEach(function (b) {
      b.addEventListener("click", function () { var s2 = st(); s2.goal = Number(b.dataset.goal); save(s2); paint(); openSheet(); });
    });
    sh.classList.add("on");
    // animate the bar filling up
    var gf = sh.querySelector(".gbar .fill"); if (gf) requestAnimationFrame(function () { requestAnimationFrame(function () { gf.style.width = gf.getAttribute("data-w") + "%"; }); });
    league().then(renderLeague).catch(function () {
      var el = document.getElementById("lwnLeague"); if (el) el.innerHTML = "<div class='muted'>League standings need an internet connection.</div>";
    });
  }

  /* ---------- weekly leagues (from Daily Challenge points) ---------- */
  function tierFor(points) { for (var i = 0; i < LEAGUES.length; i++) if (points >= LEAGUES[i].min) return LEAGUES[i]; return LEAGUES[LEAGUES.length - 1]; }
  // weekStart: a Monday (YYYY-MM-DD); defaults to this week. Counts that Monday–Sunday only.
  function league(weekStart) {
    if (!window.LWNLeaderboard || typeof LWNLeaderboard.dailyChallenge !== "function") return Promise.reject();
    var start = weekStart || monday(today()), end = shift(start, 7);
    return LWNLeaderboard.dailyChallenge({ activity: true, includeReview: false, includeDash: true }).then(function (rows) {
      var byPlayer = {};
      rows.forEach(function (r) {
        if (!r.date || r.date < start || r.date >= end) return;
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
  // remember the highest league ever reached (used for icon unlocks)
  function noteBest(tier) {
    try { var b = Number(localStorage.getItem("lwn-league-best") || 0), r = LEAGUES.length - 1 - LEAGUES.indexOf(tier); if (r > b) localStorage.setItem("lwn-league-best", String(r)); } catch (e) {}
  }
  function renderLeague(players, id) {
    var el = document.getElementById(id || "lwnLeague"); if (!el) return;
    var me = myName().toLowerCase(), mine = players.filter(function (p) { return p.key === me; })[0];
    if (mine) noteBest(tierFor(mine.points));
    var pts = mine ? mine.points : 0, tier = tierFor(pts), idx = LEAGUES.indexOf(tier), next = idx > 0 ? LEAGUES[idx - 1] : null;
    var group = players.filter(function (p) { return tierFor(p.points) === tier; });
    var rank = mine ? group.indexOf(mine) + 1 : 0;
    var who = myName() ? esc(myName()) : "You";
    var head = mine
      ? "<div class='tier' style='color:" + tier.color + "'>" + tier.icon + " " + who + ": " + tier.name + " League</div>" +
        "<div class='muted'>" + pts + " points this week" + (rank ? " · #" + rank + " in " + tier.name : "") +
        (next ? " · " + Math.ceil(next.min - pts) + " more to reach " + next.icon + " " + next.name : " · Top league! 🏆") + "</div>"
      : "<div class='tier' style='color:#24446c'>🎯 " + who + ": not in a league yet</div>" +
        "<div class='muted'>Finish a Daily Challenge or Quick Dash this week to join. Each player's league is the medal next to their name.</div>";
    if (id === "lwnLeagueP") {
      var lad = document.getElementById("lwnLadder");
      if (lad) lad.innerHTML = LEAGUES.slice().reverse().map(function (L) { return "<div class='" + (L === tier && mine ? "on" : "") + "'><span>" + L.icon + "</span><b>" + L.name + "</b>" + L.min + "+ pts</div>"; }).join("");
    }
    // everyone playing this week, all leagues together, each with their league medal
    var list = players.slice(0, id === "lwnLeagueP" ? 10 : 8);
    if (mine && list.indexOf(mine) < 0) list.push(mine);
    el.innerHTML = head + (list.length ? "<div class='muted' style='margin-top:10px;font-weight:900'>This week's players</div><ol>" + list.map(function (p) {
      return "<li class='" + (p === mine ? "me" : "") + "'><span class='n'>" + (players.indexOf(p) + 1) + "</span><span title='" + tierFor(p.points).name + "'>" + tierFor(p.points).icon + "</span><span>" + esc(p.avatar || "⭐") + "</span><span>" +
        esc(p.name) + "</span><span class='p'>" + p.points + "</span></li>";
    }).join("") + "</ol>" : "<div class='muted' style='margin-top:8px'>No one has played yet this week. Be the first!</div>");
  }

  /* ---------- weekly league everywhere: homepage card + update after each Daily Challenge / Quick Dash ---------- */
  function lgCSS() {
    if (document.getElementById("lwn-lg-css")) return;
    var c = document.createElement("style"); c.id = "lwn-lg-css";
    c.textContent =
      ".lwn-lg{margin:0 0 22px;padding:16px;border-radius:24px;background:linear-gradient(150deg,#1F2456,#3A2F7A);color:#fff;box-shadow:0 12px 28px rgba(31,36,86,.25);font-family:'Nunito',system-ui,sans-serif}" +
      ".lwn-lg .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}" +
      ".lwn-lg h3{margin:0;font:700 22px/1.1 'Fredoka',system-ui,sans-serif;color:#FFD86B}" +
      ".lwn-lg .when{flex:none;font-size:12px;font-weight:900;background:rgba(255,255,255,.14);border-radius:999px;padding:5px 10px}" +
      ".lwn-lg .when.new{background:#FFD23F;color:#3B2A00}" +
      ".lwn-lg .fresh{background:rgba(255,210,63,.16);border:2px dashed rgba(255,210,63,.6);border-radius:14px;padding:9px 11px;font-weight:900;font-size:14px;margin-bottom:10px}" +
      ".lwn-lg ol{list-style:none;margin:0;padding:0;display:grid;gap:6px}" +
      ".lwn-lg li{display:grid;grid-template-columns:28px 26px 26px 1fr auto;align-items:center;gap:6px;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.08);font-weight:900}" +
      ".lwn-lg li.me{background:rgba(255,216,107,.22);box-shadow:inset 0 0 0 2px #FFD86B}" +
      ".lwn-lg li .n{font:700 17px/1 'Fredoka',sans-serif;color:#FFD86B;text-align:center}" +
      ".lwn-lg li .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".lwn-lg li .p{font:700 16px/1 'Fredoka',sans-serif}" +
      ".lwn-lg .mine{margin:12px 0 12px;font-weight:900;font-size:15px;line-height:1.35}.lwn-lg .mine b{color:#FFD86B}" +
      ".lwn-lg .row{display:flex;gap:8px;flex-wrap:wrap}" +
      ".lwn-lg .go{flex:1;min-width:150px;text-align:center;text-decoration:none;padding:12px;border-radius:14px;background:#FFD23F;color:#2A1E00;font:700 17px/1 'Fredoka',sans-serif;box-shadow:0 4px 0 #C99A00}" +
      ".lwn-lg .all{text-align:center;text-decoration:none;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;font-weight:900}" +
      ".lwn-lgu{margin:12px 0;padding:12px 14px;border-radius:18px;background:linear-gradient(135deg,#1F2456,#3A2F7A);color:#fff;font-weight:900;font-size:15px;line-height:1.35;display:flex;gap:10px;align-items:center;animation:lwnXpcIn .5s cubic-bezier(.2,1.4,.4,1)}" +
      ".lwn-lgu .ic{flex:none;font-size:30px}.lwn-lgu b{color:#FFD86B;font-family:'Fredoka',sans-serif;font-size:17px}.lwn-lgu a{color:#FFD86B}";
    document.head.appendChild(c);
  }
  function daysLeft() { var d = today(), next = shift(monday(d), 7); return Math.round((new Date(next + "T12:00:00Z") - new Date(d + "T12:00:00Z")) / 864e5); }
  function standing(players) {
    var me = myName().toLowerCase(), i = -1;
    for (var k = 0; k < players.length; k++) if (players[k].key === me) { i = k; break; }
    var mine = i >= 0 ? players[i] : null, ahead = i > 0 ? players[i - 1] : null;
    return { mine: mine, rank: i + 1, ahead: ahead, gap: ahead ? Math.round((ahead.points - mine.points) * 100) / 100 : 0 };
  }
  function homeLeague() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page !== "index.html") return;
    var anchor = document.querySelector(".daily-treasure-banner"); if (!anchor || document.getElementById("lwnLeagueHome")) return;
    lgCSS();
    var box = document.createElement("section"); box.id = "lwnLeagueHome"; box.className = "lwn-lg"; box.setAttribute("aria-label", "This week's league");
    var isMon = new Date(today() + "T12:00:00Z").getUTCDay() === 1, left = daysLeft();
    box.innerHTML = "<div class='hd'><h3>🏆 This week’s league</h3><span class='when" + (isMon ? " new" : "") + "'>" + (isMon ? "🆕 New week!" : "Resets in " + left + " day" + (left > 1 ? "s" : "")) + "</span></div><div class='muted' style='opacity:.8'>Loading…</div>";
    anchor.insertAdjacentElement("afterend", box);
    league().then(function (players) {
      var S = standing(players), top = players.slice(0, 5), you = myName() ? esc(myName()) : "You";
      var fresh = isMon && (!S.mine || players.length < 3) ? "<div class='fresh'>🆕 Fresh league! Everyone starts at 0 this week. Play today to grab the #1 spot!</div>" : "";
      var rows = top.map(function (p, i) { return "<li class='" + (S.mine === p ? "me" : "") + "'><span class='n'>" + (i + 1) + "</span><span>" + (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "⭐") + "</span><span>" + esc(p.avatar || "⭐") + "</span><span class='nm'>" + esc(p.name) + "</span><span class='p'>" + p.points + "</span></li>"; }).join("");
      if (S.mine && S.rank > 5) rows += "<li class='me'><span class='n'>" + S.rank + "</span><span>⭐</span><span>" + esc(S.mine.avatar || "⭐") + "</span><span class='nm'>" + esc(S.mine.name) + "</span><span class='p'>" + S.mine.points + "</span></li>";
      var mine = !S.mine ? "🎯 " + you + ", you’re not on the board yet. One Daily Challenge or a 3-minute Quick Dash gets you on!"
        : S.rank === 1 ? "🏆 " + you + ", you’re <b>#1</b> this week! Keep playing to stay on top."
        : "🔥 " + you + ", you’re <b>#" + S.rank + "</b>! Just <b>" + S.gap + " points</b> to pass " + esc(S.ahead.name) + ".";
      box.innerHTML = box.querySelector(".hd").outerHTML + fresh + (rows ? "<ol>" + rows + "</ol>" : "<div class='fresh'>No one has played yet this week. Be the first!</div>") +
        "<div class='mine'>" + mine + "</div><div class='row'><a class='go' href='/daily-challenge.html'>Climb the league →</a><a class='all' href='/leaderboard.html?game=league'>Full league</a></div>";
    }).catch(function () { box.remove(); });
  }
  // after a Daily Challenge or Quick Dash: "You moved up to #2!" / "8 points to pass Kashudi"
  function resultsLeague(tries) {
    var after = document.getElementById("lwnXPC") || document.getElementById("bigScore"); if (!after) return;
    league().then(function (players) {
      var S = standing(players);
      if (!S.mine) { if ((tries || 0) < 2) setTimeout(function () { resultsLeague((tries || 0) + 1); }, 3000); return; }
      var wk = monday(today()), last = null; try { last = JSON.parse(localStorage.getItem("lwn-league-rank") || "null"); } catch (e) {}
      var moved = last && last.week === wk && last.rank > S.rank;
      try { localStorage.setItem("lwn-league-rank", JSON.stringify({ week: wk, rank: S.rank, points: S.mine.points })); } catch (e) {}
      lgCSS(); var old = document.getElementById("lwnLGU"); if (old) old.remove();
      var u = document.createElement("div"); u.id = "lwnLGU"; u.className = "lwn-lgu"; u.setAttribute("role", "status");
      u.innerHTML = "<span class='ic'>" + (moved ? "⬆️" : S.rank === 1 ? "🏆" : "🔥") + "</span><span>" +
        (moved ? "<b>You moved up to #" + S.rank + "</b> in this week’s league!" : "<b>You’re #" + S.rank + "</b> in this week’s league with " + S.mine.points + " points.") +
        (S.rank > 1 ? " Just " + S.gap + " more to pass " + esc(S.ahead.name) + "!" : " Can anyone catch you?") +
        " <a href='/leaderboard.html?game=league'>See league →</a></span>";
      (document.getElementById("lwnXPC") || after).insertAdjacentElement("afterend", u);
      if (moved) try { if (window.LWNFun) LWNFun.play("badge"); } catch (e) {}
    }).catch(function () {});
  }
  function watchLeague() {
    if (document.readyState === "loading") return document.addEventListener("DOMContentLoaded", watchLeague);
    var n = 0, iv = setInterval(function () { if (window.LWNLeaderboard || ++n > 20) { clearInterval(iv); homeLeague(); } }, 250);
    var done = document.getElementById("done");
    if (done && document.getElementById("game")) new MutationObserver(function () { if (done.classList.contains("on")) setTimeout(resultsLeague, 3500); }).observe(done, { attributes: true, attributeFilter: ["class"] });
  }
  watchLeague();

  /* ---------- mount ---------- */
  function mount() {
    css();
    if (!document.getElementById("lwnXP")) {
      var b = document.createElement("button"); b.id = "lwnXP"; b.type = "button";
      b.addEventListener("click", openSheet);
      document.body.appendChild(b);
    }
    paint();
    // Leaderboard page: show this week's league right on the page
    var panel = document.getElementById("lwnLeaguePanel");
    if (panel && !document.getElementById("lwnLeagueP")) {
      panel.innerHTML = "<div class='ladder' id='lwnLadder'></div><div class='league' id='lwnLeagueP'><div class='muted'>Loading this week's league…</div></div>" +
        "<p class='muted' style='margin:10px 2px 0'>Only Daily Challenge points count here. ⚡ XP (from games and the Daily Challenge) fills your daily goal and path. Leagues reset every Monday (Hawaiʻi time).</p>";
      var tryL = function (n) {
        league().then(function (p) { renderLeague(p, "lwnLeagueP"); }).catch(function () {
          if (n < 20) setTimeout(function () { tryL(n + 1); }, 300);
          else { var e = document.getElementById("lwnLeagueP"); if (e) e.innerHTML = "<div class='muted'>League standings need an internet connection.</div>"; }
        });
      };
      tryL(0);
    }
    // Hide the ring while a Daily Challenge round is on screen (it would sit on the Skip button).
    var game = document.getElementById("game");
    if (game) {
      var upd = function () { document.body.classList.toggle("lwn-xp-hide", game.classList.contains("on")); };
      new MutationObserver(upd).observe(game, { attributes: true, attributeFilter: ["class"] }); upd();
    }
  }

  /* ---------- end-of-round XP celebration (games' "YOU DID IT!" screen, Daily Challenge results, lab round cards) ---------- */
  var round = { xp: 0, before: null };
  function celebCSS() {
    if (document.getElementById("lwn-xpc-css")) return;
    var c = document.createElement("style"); c.id = "lwn-xpc-css";
    c.textContent =
      ".lwn-xpc{position:relative;margin:14px 0;padding:14px 14px 12px;border-radius:20px;background:linear-gradient(135deg,#1F4FA8,#3A7BE0);color:#fff;text-align:center;overflow:hidden;box-shadow:0 10px 24px rgba(31,79,168,.28);animation:lwnXpcIn .5s cubic-bezier(.2,1.4,.4,1)}" +
      ".lwn-xpc.goal{background:linear-gradient(135deg,#FF9F1C,#FF5E3A)}" +
      ".lwn-xpc .big{font:700 44px/1 'Fredoka',system-ui,sans-serif;letter-spacing:.5px;text-shadow:0 3px 0 rgba(0,0,0,.18);display:inline-block;animation:lwnXpcPop .6s .25s both}" +
      ".lwn-xpc .big i{font-style:normal;display:inline-block;animation:lwnXpcBolt 1s ease-in-out infinite}" +
      ".lwn-xpc .msg{font-weight:900;font-size:15px;margin:4px 0 10px;opacity:.95}" +
      ".lwn-xpc .bar{position:relative;height:18px;border-radius:999px;background:rgba(255,255,255,.22);overflow:visible}" +
      ".lwn-xpc .bar .f{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FFE27A,#FFC93C);transition:width 1.2s cubic-bezier(.2,.9,.3,1)}" +
      ".lwn-xpc .bar .k{position:absolute;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:15px;box-shadow:0 0 14px 4px rgba(255,226,122,.8);transition:left 1.2s cubic-bezier(.2,.9,.3,1)}" +
      ".lwn-xpc .lab{display:flex;justify-content:space-between;font-weight:900;font-size:12px;margin-top:6px;opacity:.9}" +
      ".lwn-xpc .sp{position:absolute;font-style:normal;font-size:18px;pointer-events:none;opacity:0;animation:lwnXpcSpark 1.4s ease-out forwards}" +
      ".lwn-xpc .gtag{display:inline-block;margin-top:9px;background:#fff;color:#C2410C;border-radius:999px;padding:6px 13px;font:700 15px/1 'Fredoka',system-ui,sans-serif;animation:lwnXpcPop .5s 1.3s both}" +
      "@keyframes lwnXpcIn{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}" +
      "@keyframes lwnXpcPop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}" +
      "@keyframes lwnXpcBolt{0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.2)}}" +
      "@keyframes lwnXpcSpark{0%{opacity:0;transform:translate(0,0) scale(.3)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2)}}" +
      "@media (prefers-reduced-motion:reduce){.lwn-xpc,.lwn-xpc .big,.lwn-xpc .big i,.lwn-xpc .gtag{animation:none}.lwn-xpc .sp{display:none}}";
    document.head.appendChild(c);
  }
  function celebrate(where, place) {
    if (!where || !round.xp) return;
    var old = document.getElementById("lwnXPC"); if (old) old.remove();
    celebCSS();
    var s = st(), goal = s.goal, after = s.days[today()] || 0, before = Math.max(0, round.before == null ? after - round.xp : round.before), gained = round.xp;
    round = { xp: 0, before: null };
    var crossed = before < goal && after >= goal, pctB = Math.min(100, before / goal * 100), pctA = Math.min(100, after / goal * 100);
    var msg = crossed ? "You smashed your daily goal!" : after >= goal ? "Bonus XP! " + after + " XP today 🔥" : (goal - after) + " XP to today's goal of " + goal;
    var box = document.createElement("div"); box.id = "lwnXPC"; box.className = "lwn-xpc" + (crossed ? " goal" : "");
    box.setAttribute("role", "status");
    var sparks = ""; for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; sparks += "<i class='sp' style='left:50%;top:34px;--dx:" + Math.round(Math.cos(a) * 120) + "px;--dy:" + Math.round(Math.sin(a) * 60) + "px;animation-delay:" + (.2 + (i % 3) * .12).toFixed(2) + "s'>" + ["⚡", "✨", "⭐"][i % 3] + "</i>"; }
    box.innerHTML = sparks + "<div class='big'><i>⚡</i> +<span class='n'>0</span> XP</div><div class='msg'>" + msg + "</div>" +
      "<div class='bar'><div class='f' style='width:" + pctB + "%'></div><div class='k' style='left:" + Math.max(3, pctB) + "%'>" + (crossed || after >= goal ? "🏆" : "⚡") + "</div></div>" +
      "<div class='lab'><span>" + after + " XP today</span><span>🎯 " + goal + "</span></div>" + (crossed ? "<div class='gtag'>🎯 DAILY GOAL REACHED!</div>" : "");
    if (place === "before") where.parentNode.insertBefore(box, where); else where.insertAdjacentElement(place || "afterend", box);
    // count up, then fill the bar
    var n = box.querySelector(".n"), t0 = null, dur = Math.min(1200, 400 + gained * 20);
    function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur); n.textContent = Math.round(gained * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
    setTimeout(function () { box.querySelector(".f").style.width = pctA + "%"; box.querySelector(".k").style.left = Math.max(3, pctA) + "%"; }, 350);
    try { if (window.LWNFun) { LWNFun.play(crossed ? "badge" : "combo"); if (crossed) LWNFun.confetti(140); } } catch (e) {}
  }
  function watchRounds() {
    // games with the shared "YOU DID IT!" screen
    var seen = new WeakSet();
    new MutationObserver(function () {
      var f = document.querySelector(".lwn-finale.show");
      if (f && !seen.has(f)) { seen.add(f); setTimeout(function () { var act = f.querySelector(".lwn-finale-actions"); if (act) celebrate(act, "before"); }, 250); }
      if (!document.querySelector(".lwn-finale.show")) seen = new WeakSet();
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    // Daily Challenge / Quick Dash results
    var done = document.getElementById("done");
    if (done) new MutationObserver(function () { if (done.classList.contains("on")) setTimeout(function () { var at = document.getElementById("bigScore"); celebrate(at || done.firstElementChild, "afterend"); }, 1200); }).observe(done, { attributes: true, attributeFilter: ["class"] });
    // Length / Capacity / Weight labs
    var rc = document.getElementById("roundCard");
    if (rc) new MutationObserver(function () { if (rc.classList.contains("show")) setTimeout(function () { var m = document.getElementById("roundMessage"); celebrate(m, "afterend"); }, 300); }).observe(rc, { attributes: true, attributeFilter: ["class"] });
    // a fresh round starts counting from zero
    var game = document.getElementById("game");
    if (game) new MutationObserver(function () { if (game.classList.contains("on")) round = { xp: 0, before: null }; }).observe(game, { attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchRounds); else watchRounds();

  window.LWNXP = { add: add, fromScore: fromScore, open: openSheet, state: st, league: league, standing: standing, daysLeft: daysLeft, tierFor: tierFor, leagues: LEAGUES,
    noteBest: noteBest, myName: myName, monday: monday, shift: shift, hawaiiToday: today, today: function () { return st().days[today()] || 0; } };
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 40) clearInterval(t); }, 250); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
