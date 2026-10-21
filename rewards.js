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
      ".lwn-tipcard{margin:12px 0;display:flex;flex-direction:column;gap:6px;background:#EAF4FF;border:2px solid #BFDBFE;border-radius:16px;padding:12px 14px;color:#1F3A60;font:700 15px/1.4 'Nunito',system-ui,sans-serif;text-align:left}" +
      ".lwn-tipcard b{font-weight:900}.lwn-tipcard .pts{font-size:13px;color:#4B5D80;font-weight:700}" +
      "@keyframes lwnPop{from{transform:scale(.9);opacity:0}to{transform:none;opacity:1}}" +
      "@keyframes lwnWiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(4deg)}}" +
      "@keyframes lwnShake{0%{transform:scale(1)}15%{transform:scale(1.1) rotate(-14deg)}30%{transform:scale(1.15) rotate(14deg)}45%{transform:scale(1.2) rotate(-14deg)}60%{transform:scale(1.3) rotate(14deg)}80%{transform:scale(1.6);opacity:1}100%{transform:scale(2.2);opacity:0}}" +
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
  /* ---------- big celebration: flash, shockwave, exploding confetti + emoji, fanfare ---------- */
  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function burst(x, y, opts) {
    opts = opts || {};
    if (reduced) return;
    if (x == null) { x = innerWidth / 2; y = innerHeight * 0.42; }
    var c = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483600";
    document.body.appendChild(c);
    var g = c.getContext("2d"); g.scale(dpr, dpr);
    var COLORS = ["#FFD23F", "#FF6B6B", "#1E6FD9", "#45B8ED", "#2BB673", "#FF9F1C", "#B794F4", "#FFFFFF"];
    var EMO = opts.emoji || ["⭐", "✨", "💎", "🪙", "🎉"];
    var parts = [], i, n = opts.count || 170;
    for (i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 11, emoji = i < 26;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
        w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, col: COLORS[i % COLORS.length], e: emoji ? EMO[i % EMO.length] : null, s: 18 + Math.random() * 16, life: 0 });
    }
    // a second wave of confetti raining from the top
    for (i = 0; i < 90; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
      w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, col: COLORS[i % COLORS.length], e: null, s: 0, life: 0, rain: 1 });
    var t0 = performance.now();
    function frame(t) {
      var dt = Math.min(2, (t - (frame.last || t)) / 16.7); frame.last = t;
      var el = Math.max(0, t - t0); g.clearRect(0, 0, W, H);
      if (el < 260) { // flash + shockwave ring
        var k = el / 260;
        g.fillStyle = "rgba(255,248,210," + (0.55 * (1 - k)) + ")"; g.fillRect(0, 0, W, H);
        g.beginPath(); g.arc(x, y, 30 + k * Math.max(W, H) * 0.6, 0, 6.29); g.lineWidth = 14 * (1 - k); g.strokeStyle = "rgba(255,210,63," + (1 - k) + ")"; g.stroke();
      }
      var alive = 0;
      parts.forEach(function (p) {
        p.life += dt; p.vy += (p.rain ? 0.05 : 0.32) * dt; p.vx *= Math.pow(0.985, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > H + 40) return; alive++;
        var fade = Math.max(0, Math.min(1, (260 - p.life) / 60));
        g.save(); g.globalAlpha = fade; g.translate(p.x, p.y); g.rotate(p.r);
        if (p.e) { g.font = p.s + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.e, 0, 0); }
        else { g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); }
        g.restore();
      });
      if (alive && el < 5000) requestAnimationFrame(frame); else c.remove();
    }
    requestAnimationFrame(frame);
  }
  var actx = null;
  function fanfare() {
    try {
      if (/^(true|1)$/.test(String(localStorage.getItem("lwn-sound-muted")))) return;
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var now = actx.currentTime;
      // "pop!" then a quick rising arpeggio
      var nb = actx.createBuffer(1, actx.sampleRate * 0.15, actx.sampleRate), d = nb.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      var ns = actx.createBufferSource(), ng = actx.createGain(); ns.buffer = nb; ng.gain.value = 0.35; ns.connect(ng).connect(actx.destination); ns.start(now);
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, k) {
        var o = actx.createOscillator(), gn = actx.createGain(); o.type = k < 4 ? "triangle" : "sine"; o.frequency.value = f;
        var st = now + 0.08 + k * 0.09; gn.gain.setValueAtTime(0, st); gn.gain.linearRampToValueAtTime(0.22, st + 0.02); gn.gain.exponentialRampToValueAtTime(0.001, st + (k === 4 ? 0.7 : 0.25));
        o.connect(gn).connect(actx.destination); o.start(st); o.stop(st + 0.8);
      });
    } catch (e) {}
  }
  function confetti(n, x, y, emoji) { burst(x, y, { count: n, emoji: emoji }); }
  function sound(k) { if (k === "win") fanfare(); }

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
      var cr = chest.getBoundingClientRect(), cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
      setTimeout(function () {
        var big, title, text;
        if (rw.type === "icon") { unlock(rw.icon, true); big = rw.icon; title = "A rare icon!"; text = "You found the " + rw.icon + " icon. Only treasure chests have it! Tap “Change my icon” on the homepage to use it."; }
        else if (rw.type === "freeze") { var fz = get("lwn-freeze-v1", {}) || {}; fz.have = Math.min(2, (Number(fz.have) || 0) + 1); fz.used = fz.used || []; fz.earned = fz.earned || []; set("lwn-freeze-v1", fz);
          big = "🧊"; title = "Streak freeze!"; text = "If you miss a day, this freeze saves your Daily Challenge streak."; }
        else { big = "⚡"; title = "+" + rw.xp + " bonus XP!"; text = "Added to today's goal ring."; try { if (window.LWNXP) LWNXP.add(rw.xp, "treasure chest"); } catch (e) {} }
        card.innerHTML = '<div style="font-weight:900;color:#B7791F;letter-spacing:.06em;font-size:13px">DAILY TREASURE CHEST</div>' +
          '<div class="big">' + big + '</div><h2>' + esc(title) + "</h2><p>" + esc(text) + '</p><p style="color:#8A8199;font-size:13px">A new chest is waiting tomorrow 🎁</p>' +
          '<button type="button" class="btn" data-close>Yay! ✓</button>';
        var em = rw.type === "icon" ? [rw.icon, "✨", "⭐", "💎"] : rw.type === "freeze" ? ["🧊", "❄️", "✨", "⭐"] : ["⚡", "⭐", "✨", "🪙"];
        burst(cx, cy, { count: 200, emoji: em }); fanfare();
        var bg = card.querySelector(".big"); if (bg && !reduced) bg.animate([{ transform: "scale(0) rotate(-30deg)" }, { transform: "scale(1.35) rotate(8deg)" }, { transform: "scale(1)" }], { duration: 650, easing: "cubic-bezier(.2,1.6,.4,1)" });
        checkUnlocks();
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

  /* ---------- trip banner: a game opened from My Path shows where Nini is ---------- */
  var TRIPS = {
    1: { place: "Hawaii", emoji: "🏄‍♀️", photo: "/adv-hawaii.webp", games: {
      "place-value-challenge.html": "Count Nini's seashells by hundreds, tens and ones 🐚",
      "number-battle.html": "Beach battle! Which number makes the bigger wave? 🌊",
      "money-match.html": "Count your coins for shave ice on the North Shore 🍧" } },
    2: { place: "Alaska", emoji: "⛷️", photo: "/adv-alaska.webp", games: {
      "time-match.html": "Read the clock so you catch the ski lift on time 🚡",
      "multiplication-sprint.html": "Count the skiers on every chairlift ⛷️",
      "division-dash.html": "Share the hot cocoa fairly with your ski team ☕" } },
    3: { place: "China", emoji: "🏯", photo: "/adv-china.webp", games: {
      "math-maze.html": "Find your way along the Great Wall 🧱",
      "fraction-builder.html": "Share the dumplings fairly 🥟",
      "math-detective.html": "Solve the mysteries at the watchtowers 🔎" } },
    4: { place: "Italy", emoji: "🍕", photo: "/adv-italy.webp", games: {
      "geometry-builder.html": "Build shapes like the Leaning Tower of Pisa 🗼",
      "length-lab.html": "Measure things all around Pisa 📏",
      "capacity-lab.html": "Fill the gelato cups and water jugs 🍨",
      "weight-mass-lab.html": "Weigh the ingredients for Nini's pizza 🍕" } },
    5: { place: "Underwater", emoji: "🐬", photo: "/adv-reef.webp", games: {
      "math-detective.html": "Solve the mysteries of the deep sea 🐙",
      "number-battle.html": "Which school of fish is bigger? 🐠",
      "fraction-builder.html": "Share the treasure fairly with the dolphins 🐬" } },
    6: { place: "the Horse Ranch", emoji: "🐴", photo: "/adv-ranch.webp", games: {
      "money-match.html": "Buy carrots and hay for the horses 🥕",
      "time-match.html": "Don't be late for the trail ride! ⏰",
      "division-dash.html": "Share the apples between the horses 🍎",
      "geometry-builder.html": "Build fences and barns on the ranch 🪵" } }
  };
  // Every game belongs to one trip, so its Nini photo shows her at that place
  var FOCUS = { 1: "center 62%", 2: "center 62%", 3: "center 62%", 4: "center 66%" };
  function tripPhoto() {
    var t = null; try { t = JSON.parse(sessionStorage.getItem("lwn-trip") || "null"); } catch (e) {}
    var order = Object.keys(TRIPS); if (t && t.page === page && TRIPS[t.u] && TRIPS[t.u].games[page]) order.unshift(String(t.u));
    for (var oi = 0; oi < order.length; oi++) { var u = order[oi]; if (TRIPS[u].games[page]) {
      document.querySelectorAll('img[src$="nini-hero.webp"]').forEach(function (im) {
        im.src = TRIPS[u].photo; im.alt = "Nini in " + TRIPS[u].place; im.style.setProperty("object-position", FOCUS[u] || "center 60%", "important");
      });
      return;
    } }
  }
  function tripBanner() {
    var t = null; try { t = JSON.parse(sessionStorage.getItem("lwn-trip") || "null"); } catch (e) {}
    if (!t || t.page !== page || !TRIPS[t.u] || !TRIPS[t.u].games[page] || document.getElementById("lwnTrip")) return;
    var T = TRIPS[t.u]; css();
    var s = document.createElement("style");
    s.textContent = "#lwnTrip{position:relative;z-index:50;display:flex;align-items:center;gap:12px;margin:8px auto;max-width:1100px;width:calc(100% - 20px);padding:10px 12px;border-radius:18px;color:#fff;overflow:hidden;font-family:'Nunito',system-ui,sans-serif;box-shadow:0 8px 20px rgba(30,60,100,.18)}" +
      "#lwnTrip:before{content:'';position:absolute;inset:0;background:var(--p) center/cover;z-index:-2}#lwnTrip:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,28,58,.88),rgba(8,28,58,.55));z-index:-1}" +
      "#lwnTrip img{width:46px;height:46px;border-radius:50%;border:3px solid #fff;flex:none}#lwnTrip .tx{flex:1;min-width:0}#lwnTrip b{display:block;font:700 18px/1.15 'Fredoka',sans-serif}" +
      "#lwnTrip span{display:block;font-weight:800;font-size:14px;line-height:1.3;opacity:.95}#lwnTrip a{flex:none;color:#1F2456;background:#FFD23F;border-radius:999px;padding:7px 11px;font-weight:900;font-size:13px;text-decoration:none}" +
      "#lwnTrip button{flex:none;border:0;background:rgba(255,255,255,.18);color:#fff;width:28px;height:28px;border-radius:50%;font-size:17px;cursor:pointer}" +
      "@media(max-width:520px){#lwnTrip a{display:none}#lwnTrip b{font-size:16px}#lwnTrip span{font-size:13px}}";
    document.head.appendChild(s);
    var b = document.createElement("div"); b.id = "lwnTrip"; b.style.setProperty("--p", "url('" + T.photo + "')");
    b.innerHTML = '<img src="/nini-face.webp" alt=""><div class="tx"><b>📍 You\'re in ' + esc(T.place) + "! " + T.emoji + "</b><span>" + esc(T.games[page]) + '</span></div><a href="/path.html#u' + t.u + '">🗺️ My Path</a><button type="button" aria-label="Hide">×</button>';
    b.querySelector("button").onclick = function () { b.remove(); };
    var header = document.querySelector("header, .topbar, .appbar, nav");
    if (header && header.parentNode === document.body) header.insertAdjacentElement("afterend", b); else document.body.insertBefore(b, document.body.firstChild);
  }

  /* ---------- friendlier Daily Challenge: first-time tips + right-grade advice after each round ---------- */
  var POINTS_LINE = "Each right answer = 1 point (¾ point on the 2nd try, ½ on the 3rd). The timer keeps going, so answer as many as you can!";
  function dailyHelper() {
    if (page !== "daily-challenge.html") return;
    css();
    var log = get("dm-log", []) || [];
    var go = document.getElementById("goBtn"), grade = document.getElementById("gradeSeg");
    if (!log.length && grade && !document.getElementById("lwnFirstTip")) {
      var tip = document.createElement("div"); tip.id = "lwnFirstTip"; tip.className = "lwn-tipcard";
      tip.innerHTML = "<b>👋 First time? Here's how to start</b><span>Pick the grade you're in now and try <b>10 minutes</b>. Too easy? Move up a grade next time!</span><span class='pts'>⭐ " + esc(POINTS_LINE) + "</span>";
      var field = grade.closest(".field") || grade; field.parentNode.insertBefore(tip, field);
      var ten = document.querySelector('#minSeg button[data-v="10"]'); if (ten) setTimeout(function () { ten.click(); }, 50);
    }
    var done = document.getElementById("done"); if (!done) return;
    new MutationObserver(function () {
      if (!done.classList.contains("on")) return;
      setTimeout(function () {
        var L = get("dm-log", []) || [], r = L[L.length - 1]; if (!r || r.date !== hiToday()) return;
        var old = document.getElementById("lwnAfterTip"); if (old) old.remove();
        var att = Number(r.attempted) || 0, acc = att ? (Number(r.correct) || 0) / att : 0, g = String(r.grade), gn = parseInt(g, 10), msg = "";
        if (att < 5) msg = "You answered <b>" + att + "</b> question" + (att === 1 ? "" : "s") + ". The timer keeps running, so keep going until the end next time for lots more points! 💪";
        else if (acc < 0.5 && gn > 2) msg = "That one was tricky! 🧗 Try <b>Grade " + (gn - 1) + "</b> next time, then move back up when it feels easy.";
        else if (acc >= 0.9 && att >= 15 && gn < 5) msg = "Wow, <b>" + Math.round(acc * 100) + "%</b> right! 🚀 Ready to try <b>Grade " + (gn + 1) + "</b>?";
        else if (acc >= 0.7) msg = "Great job! <b>" + Math.round(acc * 100) + "%</b> right. 🌟 Come back tomorrow to grow your streak!";
        else msg = "Nice work! <b>" + Math.round(acc * 100) + "%</b> right. Every day of practice makes you faster. 🌱";
        var box = document.createElement("div"); box.id = "lwnAfterTip"; box.className = "lwn-tipcard";
        box.innerHTML = "<span>" + msg + "</span><span class='pts'>⭐ " + esc(POINTS_LINE) + "</span>";
        var stats = document.getElementById("stats"); if (stats) stats.insertAdjacentElement("afterend", box);
      }, 400);
    }).observe(done, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- "What's new" pop-up, once, for families who visited before ---------- */
  var NEWS_ID = "2026-10-20", NEWS_UNTIL = "2026-11-03", newsTries = 0; // shown once per family, and not at all after NEWS_UNTIL
  function whatsNew(force) {
    if (page !== "index.html") return;
    var today = new Date().toLocaleDateString("en-CA");
    var later = get("lwn-news-later", {}) || {};
    if (force !== true) {
    if (get("lwn-news-seen", "") === NEWS_ID) return;
    if (new Date().toISOString().slice(0, 10) > NEWS_UNTIL) return;
    // "Read later": wait until tomorrow, at most 3 showings
    if (later.id === NEWS_ID && (later.day === today || (later.n || 0) >= 3)) return;
    // signed-in parent: wait until this device has pulled the account, so a pop-up seen on another device counts here too
    try { if (localStorage.getItem("sb-lwn-auth") && !sessionStorage.getItem("lwn-sync-pulled") && ++newsTries < 6) { setTimeout(whatsNew, 1500); return; } } catch (e) {}
    var returning = (get("dm-log", []) || []).length || localStorage.getItem("lwn-xp-v1") || localStorage.getItem("lwn-badges-v1");
    if (!returning) { set("lwn-news-seen", NEWS_ID); return; } // brand-new visitors already see everything fresh
    if (document.querySelector(".lwn-modal,#lwnWelcome,#lwnProfile")) { setTimeout(whatsNew, 2500); return; }
    }
    var m = modal('<div style="font-weight:900;color:#1E6FD9;letter-spacing:.06em;font-size:13px">WHAT\'S NEW</div><h2>Big update! 🎉</h2>' +
      '<div style="text-align:left;margin:10px 0 4px;display:grid;gap:9px;font-weight:800;color:#3c4566;line-height:1.35">' +
      "<div>🗺️ <b>Travel with Nini</b> to Hawaii, Alaska, China, Italy, under the sea and a horse ranch</div>" +
      "<div>⚔️ <b>Boss battles</b> and passport stamps with postcards from Nini</div>" +
      "<div>🎁 <b>A treasure chest every day</b> you play</div>" +
      "<div>🦭 <b>20 icons</b> plus rare ones to collect</div>" +
      "<div>🏆 <b>Weekly leagues</b> from Bronze to Diamond</div>" +
      "<div>👨‍👩‍👧 <b>For parents:</b> a weekly progress page</div></div>" +
      '<a class="btn" href="/path.html" data-news="read">Start the adventure →</a>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn ghost" data-close data-news="later" style="flex:1;margin:0;border:2px solid #E3EEFA;border-radius:14px;padding:11px 6px">⏰ Read later</button>' +
      '<button type="button" class="btn ghost" data-close data-news="read" style="flex:1;margin:0;border:2px solid #E3EEFA;border-radius:14px;padding:11px 6px">✓ I\'ve read this</button></div>');
    if (force !== true) {
      var lastLater = later.id === NEWS_ID ? (later.n || 0) : 0;
      // closing by tapping outside counts as "read later"
      set("lwn-news-later", { id: NEWS_ID, day: today, n: lastLater + 1 });
    }
    m.querySelectorAll("[data-news]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("data-news") === "read") set("lwn-news-seen", NEWS_ID);
        try { if (window.LWNAccount) LWNAccount.push(true).catch(function () {}); } catch (e) {}
      });
    });
    burst(null, null, { count: 120, emoji: ["🎉", "⭐", "🗺️", "🎁"] });
  }

  window.LWNIcons = { locked: LOCKED, unlocked: unlocked, isUnlocked: function (i) { return unlocked().indexOf(i) >= 0; }, unlock: unlock, check: checkUnlocks, openChest: openChest };

  function start() {
    beatNiniBanner();
    tripBanner();
    tripPhoto();
    dailyHelper();
    setTimeout(function () { checkUnlocks(); chestButton(); }, 1200);
    setTimeout(leagueRecap, 2500);
    setTimeout(whatsNew, 1800);
    // "What's new" link in the homepage footer, so families can open it again anytime
    if (page === "index.html") {
      var fl = document.querySelector(".footer-links");
      if (fl && !document.getElementById("lwnNewsLink")) { var a = document.createElement("a"); a.id = "lwnNewsLink"; a.href = "#whats-new"; a.textContent = "🎉 What’s new"; fl.appendChild(a); }
      var openNews = function () { if (location.hash === "#whats-new") { history.replaceState(null, "", location.pathname); if (!document.querySelector(".lwn-modal")) whatsNew(true); } };
      addEventListener("hashchange", openNews); openNews();
    }
    // hide the chest button while a Daily Challenge round is on screen
    var game = document.getElementById("game");
    if (game) new MutationObserver(function () { var b = document.getElementById("lwnChestBtn"); if (game.classList.contains("on")) { if (b) b.remove(); } else chestButton(); }).observe(game, { attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
