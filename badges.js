/* Learn With Nini – Daily Challenge badges
   Saved on this device only. Reads the same progress the Daily Challenge already keeps (dm-log). */
window.LWNBadges = (function () {
  // Nini's leaderboard nickname, used for the "Beat Nini" badge. Leave "" to hide that badge.
  var NINI_NAME = "Graceful sealion";

  var KEY = "lwn-badges-v1";
  var BADGES = [
    { id: "first",      icon: "🎉", name: "First Challenge", how: "Finish your first daily challenge" },
    { id: "streak3",    icon: "🔥", name: "On a Roll",       how: "3 days in a row" },
    { id: "streak7",    icon: "⭐", name: "One Week",        how: "7 days in a row" },
    { id: "streak14",   icon: "🌟", name: "Two Weeks",       how: "14 days in a row" },
    { id: "streak30",   icon: "🏆", name: "Math Month",      how: "30 days in a row" },
    { id: "streak100",  icon: "👑", name: "100 Days",        how: "100 days in a row" },
    { id: "days10",     icon: "📅", name: "10 Challenges",   how: "Finish 10 daily challenges" },
    { id: "days50",     icon: "🗓️", name: "50 Challenges",   how: "Finish 50 daily challenges" },
    { id: "correct100", icon: "🧠", name: "100 Correct",     how: "Get 100 questions right" },
    { id: "correct500", icon: "🚀", name: "500 Correct",     how: "Get 500 questions right" },
    { id: "correct1000",icon: "💎", name: "1,000 Correct",   how: "Get 1,000 questions right" },
    { id: "perfect",    icon: "💯", name: "Perfect Score",   how: "100% right with 10+ answered" },
    { id: "brave",      icon: "💪", name: "Brave Brain",     how: "Finish a Challenge-mode day" },
    { id: "beatnini",   icon: "🥇", name: "Beat Nini",       how: "Tie or beat Nini's score on the same day, grade, mode and time" }
  ];

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function earned() { var e = load(KEY, {}); return e && typeof e === "object" ? e : {}; }
  function list() { return BADGES.filter(function (b) { return b.id !== "beatnini" || NINI_NAME; }); }

  // Which badges the saved history qualifies for (everything except Beat Nini, which needs the leaderboard).
  function qualified(p) {
    var log = load("dm-log", []); if (!Array.isArray(log)) log = [];
    var best = (p && p.best) || 0, days = (p && p.completed) || 0, correct = (p && p.totalCorrect) || 0;
    var q = {};
    if (days >= 1) q.first = 1;
    [3, 7, 14, 30, 100].forEach(function (n) { if (best >= n) q["streak" + n] = 1; });
    if (days >= 10) q.days10 = 1;
    if (days >= 50) q.days50 = 1;
    [100, 500, 1000].forEach(function (n) { if (correct >= n) q["correct" + n] = 1; });
    log.forEach(function (x) {
      if (!x) return;
      var a = Number(x.attempted) || 0, c = Number(x.correct) || 0;
      if (a >= 10 && c === a) q.perfect = 1;
      if (String(x.mode) === "challenge") q.brave = 1;
    });
    return q;
  }

  // Award anything newly qualified; returns the badges that are new this time.
  function award(ids, date) {
    var e = earned(), fresh = [];
    ids.forEach(function (id) { if (!e[id]) { e[id] = date || new Date().toISOString().slice(0, 10); fresh.push(id); } });
    if (fresh.length) save(KEY, e);
    return fresh;
  }

  function css() {
    if (document.getElementById("lwn-badge-css")) return;
    var s = document.createElement("style"); s.id = "lwn-badge-css";
    s.textContent =
      ".badge-shelf{background:#fff;border:2px solid #EFE3C2;border-radius:20px;padding:14px;margin-top:12px}" +
      ".badge-shelf h2{font-family:'Fredoka',sans-serif;color:#5932BD;font-size:20px;margin:0 0 2px}" +
      ".badge-shelf p{margin:0 0 10px;color:#7A718D;font-size:13px;font-weight:700}" +
      ".badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px}" +
      ".badge{border:0;background:#FFF7FB;border-radius:16px;padding:10px 4px 8px;text-align:center;cursor:pointer;font:inherit;color:#382879}" +
      ".badge .bi{font-size:30px;line-height:1.1;display:block}" +
      ".badge .bn{display:block;font-size:11px;font-weight:900;margin-top:4px;line-height:1.15}" +
      ".badge.locked{background:#F4F2F8;color:#A49DB5}.badge.locked .bi{filter:grayscale(1);opacity:.35}" +
      ".badge-tip{margin-top:10px;background:#F2ECFF;border-radius:12px;padding:8px 10px;font-size:13px;font-weight:800;color:#4b3a8f;min-height:18px}" +
      ".badge-win{background:linear-gradient(135deg,#FFF7D7,#FFE3F1);border:2px solid #F7C948;border-radius:20px;padding:14px;margin:0 0 14px;text-align:center;animation:lwnPop .5s ease-out}" +
      ".badge-win h2{font-family:'Fredoka',sans-serif;color:#C2185B;margin:0 0 8px;font-size:22px}" +
      ".badge-win .wins{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}" +
      ".badge-win .w{background:#fff;border-radius:16px;padding:10px 12px;min-width:84px}" +
      ".badge-win .w b{display:block;font-size:38px;line-height:1.1}.badge-win .w span{font-size:12px;font-weight:900;color:#382879}" +
      ".badge-win .note{margin-top:8px;font-size:13px;font-weight:700;color:#7A718D}" +
      "@keyframes lwnPop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}";
    document.head.appendChild(s);
  }

  // Trophy shelf on the start screen.
  function render(p) {
    css();
    award(Object.keys(qualified(p)));
    var shelf = document.getElementById("badgeShelf");
    if (!shelf) {
      var panel = document.querySelector(".progress-panel");
      if (!panel) return;
      shelf = document.createElement("section");
      shelf.id = "badgeShelf"; shelf.className = "badge-shelf"; shelf.setAttribute("aria-label", "Badges");
      panel.insertAdjacentElement("afterend", shelf);
    }
    var e = earned(), items = list(), have = items.filter(function (b) { return e[b.id]; }).length;
    shelf.innerHTML = "<h2>🏅 My badges</h2><p>" + have + " of " + items.length + " earned · tap a badge to see how to get it</p>" +
      '<div class="badge-grid">' + items.map(function (b) {
        return '<button type="button" class="badge' + (e[b.id] ? "" : " locked") + '" data-id="' + b.id + '">' +
          '<span class="bi">' + b.icon + '</span><span class="bn">' + b.name + "</span></button>";
      }).join("") + '</div><div class="badge-tip" id="badgeTip" aria-live="polite"></div>';
    shelf.querySelectorAll(".badge").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var b = BADGES.filter(function (x) { return x.id === btn.dataset.id; })[0];
        var when = e[b.id];
        document.getElementById("badgeTip").textContent = b.icon + " " + b.name + ": " +
          (when ? "earned " + when + "! 🎉" : b.how + ".");
      });
    });
  }

  function celebrate(ids, note) {
    if (!ids.length && !note) return;
    if (ids.length) { try { window.LWNFun && setTimeout(function () { LWNFun.play("badge"); }, 900); } catch (e) {} }
    css();
    var done = document.querySelector("#done .done");
    if (!done) return;
    var box = document.getElementById("badgeWin");
    if (!box) {
      box = document.createElement("section"); box.id = "badgeWin"; box.className = "badge-win";
      box.setAttribute("aria-live", "polite");
      done.insertBefore(box, done.firstChild);
    }
    var shown = (box.dataset.ids ? box.dataset.ids.split(",") : []).concat(ids);
    box.dataset.ids = shown.join(",");
    var items = BADGES.filter(function (b) { return shown.indexOf(b.id) >= 0; });
    box.innerHTML = (items.length ? "<h2>" + (items.length > 1 ? "New badges!" : "New badge!") + " 🎉</h2>" +
      '<div class="wins">' + items.map(function (b) {
        return '<div class="w"><b>' + b.icon + "</b><span>" + b.name + "</span></div>";
      }).join("") + "</div>" : "") +
      (note ? '<div class="note">' + note + "</div>" : "");
  }

  // Called by the Daily Challenge right after a result is saved.
  function afterFinish(r) {
    if (!r || r.test || !(r.attempted > 0)) return;
    var fresh = award(Object.keys(qualified(r.progress)), r.date);
    celebrate(fresh);
    checkBeatNini(r);
  }

  function checkBeatNini(r) {
    if (!NINI_NAME || !window.LWNLeaderboard || typeof LWNLeaderboard.dailyChallenge !== "function") return;
    var me = String(r.player || "").trim().toLowerCase();
    if (me === NINI_NAME.toLowerCase()) return; // Nini can't beat herself
    LWNLeaderboard.dailyChallenge({ date: r.date, minutes: r.mins, includeReview: true, activity: true })
      .then(function (rows) {
        var hers = rows.filter(function (x) {
          return String(x.name).trim().toLowerCase() === NINI_NAME.toLowerCase() &&
            String(x.grade) === String(r.grade) && String(x.mode) === String(r.mode);
        })[0];
        if (!hers) { celebrate([], "Nini hasn't posted this exact challenge yet — check back later to see if you beat her!"); return; }
        if (r.points >= hers.score) {
          celebrate(award(["beatnini"], r.date), "You scored " + r.points + " — Nini scored " + hers.score + ". You beat Nini! 🥇");
        } else {
          celebrate([], "Nini scored " + hers.score + " on this challenge. So close — try again tomorrow!");
        }
      })
      .catch(function () {});
  }

  return { render: render, afterFinish: afterFinish, list: list };
})();
