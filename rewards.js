/* Learn With Nini – reasons to come back tomorrow.
   1. Daily treasure chest (first XP each day → a chest to open)
   2. Collectible icons unlocked by milestones
   3. "Beat Nini today" banner on the Daily Challenge
   4. Weekly league recap every Monday */
(function () {
  if (window.LWNIcons) return;
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hiToday() {
    if (window.LWNXP && LWNXP.hawaiiToday) return LWNXP.hawaiiToday();
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu" }).format(new Date());
  }
  function myName() { var p = get("learningWithNiniProfileV1", null); return p && p.name ? String(p.name).trim() : ""; }
  var NINI = "Graceful sealion";
  var HUBS = ["index.html", "path.html", "leaderboard.html", "daily-challenge.html", "games.html", "account.html"];

  /* ---------- shared look ---------- */
  function css() {
    if (document.getElementById("lwnRewardsCss")) return;
    var s = document.createElement("style"); s.id = "lwnRewardsCss";
    s.textContent =
      ".lwn-modal{position:fixed;inset:0;z-index:2147483500;background:rgba(20,44,74,.5);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
      ".lwn-modal .card{width:min(420px,100%);background:#fff;border-radius:28px;padding:24px 20px;text-align:center;color:#203D61;box-shadow:0 28px 70px rgba(29,59,96,.35);animation:lwnPop .35s ease-out}" +
      ".lwn-modal h2{font:700 27px/1.1 'Fredoka',system-ui,sans-serif;color:#1E6FD9;margin:8px 0 6px}" +
      ".lwn-modal p{margin:6px 0;font-weight:800;color:#55607F;line-height:1.4}" +
      ".lwn-modal .big{font-size:84px;line-height:1.05}" +
      ".lwn-modal .btn{display:block;width:100%;margin-top:16px;border:0;border-radius:16px;padding:14px;background:linear-gradient(135deg,#45b8ed,#1E6FD9);color:#fff;font:700 19px/1 'Fredoka',sans-serif;cursor:pointer;text-decoration:none}" +
      ".lwn-modal .ghost{background:none;color:#6B7392;font:900 15px 'Nunito',sans-serif;margin-top:6px}" +
      ".lwn-chest-tap{cursor:pointer;animation:lwnWiggle 1.2s ease-in-out infinite;display:inline-block;border:0;background:none;font-size:96px;line-height:1}" +
      ".lwn-chest-open{animation:lwnShake .5s ease-in-out}" +
      "#lwnChestBtn{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9990;border:0;border-radius:22px;background:linear-gradient(135deg,#FFD84D,#F7A400);box-shadow:0 10px 24px rgba(160,100,0,.35);padding:10px 14px 9px;font:800 13px/1.1 'Nunito',sans-serif;color:#4a3300;cursor:pointer;display:flex;flex-direction:column;align-items:center;animation:lwnBob 1.6s ease-in-out infinite}" +
      "#lwnChestBtn b{font-size:30px;line-height:1}" +
      ".lwn-beatnini{margin:12px 0 4px;display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#FFF6D6,#FFE9C2);border:2px solid #F5D27A;border-radius:18px;padding:12px 14px;font-weight:800;color:#5A4000;line-height:1.35}" +
      ".lwn-beatnini img{width:52px;height:52px;border-radius:50%;border:3px solid #fff;flex:none;box-shadow:0 4px 10px rgba(0,0,0,.12)}" +
      ".lwn-beatnini b{font-family:'Fredoka',sans-serif;font-size:1.25em;color:#C2410C}" +
      ".lwn-toast2{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);z-index:2147483400;background:#1d3c63;color:#fff;border-radius:16px;padding:11px 16px;font:800 15px/1.3 'Nunito',sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.25);transition:transform .35s;max-width:92vw;text-align:center}" +
      ".lwn-toast2.on{transform:translate(-50%,0)}" +
      "@keyframes lwnPop{from{transform:scale(.9);opacity:0}to{transform:none;opacity:1}}" +
      "@keyframes lwnWiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(4deg)}}" +
      "@keyframes lwnShake{0%,100%{transform:scale(1)}50%{transform:scale(1.25) rotate(8deg)}}" +
      "@keyframes lwnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}" +
      "@media (prefers-reduced-motion:reduce){.lwn-chest-tap,#lwnChestBtn{animation:none}}";
    document.head.appendChild(s);
  }
  function modal(html) {
    css();
    var m = document.createElement("div"); m.className = "lwn-modal";
    m.innerHTML = '<div class="card" role="dialog" aria-modal="true">' + html + "</div>";
    m.addEventListener("click", function (e) { if (e.target === m || e.target.hasAttribute("data-close")) m.remove(); });
    document.body.appendChild(m); return m;
  }
  function toast(text) {
    css();
    var t = document.createElement("div"); t.className = "lwn-toast2"; t.textContent = text; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("on"); });
    setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 400); }, 3200);
  }
  function confetti(n) { try { if (window.LWNFun && LWNFun.confetti) LWNFun.confetti(n || 120); } catch (e) {} }
  function sound(k) { try { if (window.LWNFun && LWNFun.play) LWNFun.play(k); } catch (e) {} }

  /* ---------- 2. collectible icons ---------- */
  var CHEST_ICONS = ["🦜", "🐙", "🦩", "🐳", "🦚"];
  var MILESTONES = [
    { i: "🐉", how: "Earn 300 XP", t: function (s) { return s.xp >= 300; } },
    { i: "🦖", how: "Earn 1,000 XP", t: function (s) { return s.xp >= 1000; } },
    { i: "🦁", how: "Finish 7 Daily Challenges", t: function (s) { return s.daily >= 7; } },
    { i: "👑", how: "Finish 30 Daily Challenges", t: function (s) { return s.daily >= 30; } },
    { i: "🏅", how: "Earn 5 badges", t: function (s) { return s.badges >= 5; } },
    { i: "🥇", how: "Reach the Gold league", t: function (s) { return s.league >= 2; } },
    { i: "💎", how: "Reach the Diamond league", t: function (s) { return s.league >= 3; } },
    { i: "🗺️", how: "Beat your first boss on My Path", t: function (s) { return s.bosses >= 1; } },
    { i: "🌋", how: "Beat all 4 bosses on My Path", t: function (s) { return s.bosses >= 4; } }
  ];
  var LOCKED = MILESTONES.map(function (m) { return { i: m.i, how: m.how }; })
    .concat(CHEST_ICONS.map(function (i) { return { i: i, how: "Find it in a daily treasure chest 🎁" }; }));

  function stats() {
    var xp = get("lwn-xp-v1", {}), games = xp.games || {}, total = 0;
    Object.keys(games).forEach(function (k) { total += Number(games[k]) || 0; });
    var days = {}; (get("dm-log", []) || []).forEach(function (r) { if (r && r.date) days[r.date] = 1; });
    var boss = get("lwn-boss-v1", {}), bosses = Object.keys(boss).filter(function (k) { return boss[k]; }).length;
    return { xp: total, daily: Math.max(Number(xp.dailyDone) || 0, Object.keys(days).length),
      badges: Object.keys(get("lwn-badges-v1", {}) || {}).length, league: Number(get("lwn-league-best", 0)) || 0, bosses: bosses };
  }
  function unlocked() { var u = get("lwn-icons-v1", []); return Array.isArray(u) ? u : []; }
  function unlock(icon, quiet) {
    var u = unlocked(); if (u.indexOf(icon) >= 0) return false;
    u.push(icon); set("lwn-icons-v1", u);
    if (!quiet) { toast("🎉 New icon unlocked: " + icon + "  Tap “Change my icon” to use it!"); sound("win"); }
    return true;
  }
  function checkUnlocks() {
    var s = stats(), got = [];
    MILESTONES.forEach(function (m) { if (m.t(s) && unlocked().indexOf(m.i) < 0) { unlock(m.i, true); got.push(m.i); } });
    if (got.length) { toast("🎉 New icon" + (got.length > 1 ? "s" : "") + " unlocked: " + got.join(" ") + "  Tap “Change my icon” to use " + (got.length > 1 ? "them" : "it") + "!"); sound("win"); }
  }

  /* ---------- 1. daily treasure chest ---------- */
  function chestState() { return get("lwn-chest-v1", {}); }
  function chestReady() { var c = chestState(); return c.ready === hiToday() && c.opened !== hiToday(); }
  function chestButton() {
    var b = document.getElementById("lwnChestBtn");
    if (!chestReady()) { if (b) b.remove(); return; }
    // only on hub pages, never on top of a game in progress
    if (HUBS.indexOf(page) < 0) return;
    if (b || page === "daily-challenge.html" && document.querySelector("#game.on")) return;
    css();
    b = document.createElement("button"); b.id = "lwnChestBtn"; b.type = "button";
    b.innerHTML = "<b>🎁</b>Open!"; b.setAttribute("aria-label", "Open your daily treasure chest");
    b.onclick = openChest; document.body.appendChild(b);
  }
  function pickReward() {
    var missing = CHEST_ICONS.filter(function (i) { return unlocked().indexOf(i) < 0; });
    var fz = get("lwn-freeze-v1", {}) || {}, r = Math.random();
    if (r < 0.2 && missing.length) return { type: "icon", icon: missing[Math.floor(Math.random() * missing.length)] };
    if (r < 0.32 && (Number(fz.have) || 0) < 2) return { type: "freeze" };
    var xp = [10, 10, 15, 15, 20, 25][Math.floor(Math.random() * 6)];
    return { type: "xp", xp: xp };
  }
  function openChest() {
    if (!chestReady()) return;
    var b = document.getElementById("lwnChestBtn"); if (b) b.remove();
    var m = modal('<div style="font-weight:900;color:#B7791F;letter-spacing:.06em;font-size:13px">DAILY TREASURE CHEST</div>' +
      '<h2>Tap the chest!</h2><button type="button" class="lwn-chest-tap" aria-label="Open chest">🎁</button>' +
      '<p>You earned it by playing today ⭐</p>');
    var chest = m.querySelector(".lwn-chest-tap");
    chest.onclick = function () {
      var c = chestState(); if (c.opened === hiToday()) return;
      c.opened = hiToday(); set("lwn-chest-v1", c);
      chest.style.animation = "none"; chest.classList.add("lwn-chest-open");
      var rw = pickReward(), card = m.querySelector(".card");
      setTimeout(function () {
        var big, title, text;
        if (rw.type === "icon") { unlock(rw.icon, true); big = rw.icon; title = "A rare icon!"; text = "You found the " + rw.icon + " icon. Only treasure chests have it! Tap “Change my icon” on the homepage to use it."; }
        else if (rw.type === "freeze") { var fz = get("lwn-freeze-v1", {}) || {}; fz.have = Math.min(2, (Number(fz.have) || 0) + 1); fz.used = fz.used || []; fz.earned = fz.earned || []; set("lwn-freeze-v1", fz);
          big = "🧊"; title = "Streak freeze!"; text = "If you miss a day, this freeze saves your Daily Challenge streak."; }
        else { big = "⚡"; title = "+" + rw.xp + " bonus XP!"; text = "Added to today's goal ring."; try { if (window.LWNXP) LWNXP.add(rw.xp, "treasure chest"); } catch (e) {} }
        card.innerHTML = '<div style="font-weight:900;color:#B7791F;letter-spacing:.06em;font-size:13px">DAILY TREASURE CHEST</div>' +
          '<div class="big">' + big + '</div><h2>' + esc(title) + "</h2><p>" + esc(text) + '</p><p style="color:#8A8199;font-size:13px">A new chest is waiting tomorrow 🎁</p>' +
          '<button type="button" class="btn" data-close>Yay! ✓</button>';
        confetti(140); sound("win"); checkUnlocks();
      }, 550);
    };
  }
  window.addEventListener("lwn:xp", function (e) {
    var why = e.detail && e.detail.why; if (why === "treasure chest") { setTimeout(checkUnlocks, 600); return; }
    var c = chestState();
    if (c.ready !== hiToday()) { c.ready = hiToday(); set("lwn-chest-v1", c); toast("🎁 You earned today's treasure chest! " + (HUBS.indexOf(page) >= 0 ? "Tap the 🎁 to open it." : "Open it on the home page.")); }
    setTimeout(function () { chestButton(); checkUnlocks(); }, 600);
  });

  /* ---------- 3. "Beat Nini today" on the Daily Challenge ---------- */
  function beatNiniBanner() {
    if (page !== "daily-challenge.html") return;
    var hello = document.querySelector("#start .hello"); if (!hello || document.getElementById("lwnBeatNini")) return;
    css();
    var box = document.createElement("div"); box.id = "lwnBeatNini"; box.className = "lwn-beatnini";
    var me = myName().toLowerCase();
    var face = '<img src="/nini-face.webp" alt="">';
    if (me === NINI.toLowerCase()) { box.innerHTML = face + "<div>⭐ Kids everywhere are trying to beat <b>your</b> score today. Go set a great one!</div>"; hello.insertAdjacentElement("afterend", box); return; }
    box.innerHTML = face + "<div>🎯 Checking Nini's score for today…</div>";
    hello.insertAdjacentElement("afterend", box);
    var tries = 0;
    (function load() {
      if (!window.LWNLeaderboard || typeof LWNLeaderboard.dailyChallenge !== "function") { if (++tries < 20) setTimeout(load, 300); return; }
      LWNLeaderboard.dailyChallenge({ date: hiToday(), activity: true, includeReview: true }).then(function (rows) {
        var hers = rows.filter(function (x) { return String(x.name).trim().toLowerCase() === NINI.toLowerCase() && x.date === hiToday(); })
          .sort(function (a, b) { return b.score - a.score; })[0];
        box.innerHTML = face + (hers
          ? "<div>🎯 Today Nini scored <b>" + esc(hers.score) + "</b> <span style='font-weight:700'>(Grade " + esc(hers.grade || "3") + " · " + esc(hers.minutes || 20) + " min)</span>. Can you beat her?</div>"
          : "<div>🎬 Nini hasn't done today's challenge yet. Go first and set a score for her to beat!</div>");
      }).catch(function () { box.remove(); });
    })();
  }

  /* ---------- 4. weekly league recap (shown once, the first visit of a new week) ---------- */
  function leagueRecap() {
    if (!window.LWNXP || !LWNXP.league || !myName()) return;
    if (document.querySelector(".lwn-modal,#lwnWelcome,#lwnProfile")) return;
    var thisMon = LWNXP.monday(hiToday()), lastMon = LWNXP.shift(thisMon, -7);
    if (get("lwn-recap-v1", "") === lastMon) return;
    LWNXP.league(lastMon).then(function (players) {
      set("lwn-recap-v1", lastMon);
      var me = myName().toLowerCase(), mine = players.filter(function (p) { return p.key === me; })[0];
      if (!mine) return;
      var tier = LWNXP.tierFor(mine.points), L = LWNXP.leagues, idx = L.indexOf(tier), next = idx > 0 ? L[idx - 1] : null;
      LWNXP.noteBest(tier);
      var group = players.filter(function (p) { return LWNXP.tierFor(p.points) === tier; }), rank = group.indexOf(mine) + 1;
      var medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🎉";
      modal('<div style="font-weight:900;color:#1E6FD9;letter-spacing:.06em;font-size:13px">LAST WEEK\'S LEAGUE</div>' +
        '<div class="big">' + tier.icon + "</div><h2>" + esc(tier.name) + " League " + medal + "</h2>" +
        "<p>You finished <b>#" + rank + "</b> in " + esc(tier.name) + " with <b>" + mine.points + "</b> Daily Challenge points!</p>" +
        "<p>" + (next ? "This week, reach <b>" + next.min + "</b> points to make it to " + next.icon + " " + esc(next.name) + "!" : "You were in the top league! Can you stay there this week? 💎") + "</p>" +
        '<a class="btn" href="/daily-challenge.html">Start this week strong →</a><button type="button" class="btn ghost" data-close>Close</button>');
      if (rank <= 3) confetti(160);
      checkUnlocks();
    }).catch(function () {});
  }

  window.LWNIcons = { locked: LOCKED, unlocked: unlocked, isUnlocked: function (i) { return unlocked().indexOf(i) >= 0; }, unlock: unlock, check: checkUnlocks, openChest: openChest };

  function start() {
    beatNiniBanner();
    setTimeout(function () { checkUnlocks(); chestButton(); }, 1200);
    setTimeout(leagueRecap, 2500);
    // hide the chest button while a Daily Challenge round is on screen
    var game = document.getElementById("game");
    if (game) new MutationObserver(function () { var b = document.getElementById("lwnChestBtn"); if (game.classList.contains("on")) { if (b) b.remove(); } else chestButton(); }).observe(game, { attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
