/* Learn With Nini – bring families back.
   1. Welcome-back card (once a day, returning players): name, streak, today's chest, this week's Case File.
   2. After a game: invite grown-ups to the weekly progress report + new-mystery email.
      Never shown to parents who already said yes. Parents who said no are asked once more at most, a week later.
   3. One-time ask for signed-in parents who never made an email choice (accounts made before the checkbox).
   4. Seasonal "what's new" ask for parents who said no: at most once per season (key below), on the homepage,
      never within 7 days of their last choice or of another ask.
   Nothing is ever emailed unless a parent taps "Yes". */
(function () {
  if (window.LWNRetain) return;
  window.LWNRetain = true;
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (["privacy.html", "parents-teachers.html", "unsubscribe.html", "account.html"].indexOf(page) >= 0) return;

  function raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hiDay(d) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu" }).format(d || new Date()); }
  function addDays(day, n) { var d = new Date(day + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function track(ev, detail) { try { if (window.LWNStats) LWNStats.track(ev, detail); } catch (e) {} }
  var today = hiDay();

  function prof() { var p = get("learningWithNiniProfileV1", null) || {}; return { name: String(p.name || raw("niniPlayerName") || "").trim(), avatar: p.avatar || "⭐" }; }
  function signedIn() { var t = get("sb-lwn-auth", null); return !!(t && (t.refresh_token || (t.currentSession && t.currentSession.refresh_token))); }
  function busy() { return !!document.querySelector(".lwn-modal,#lwnWelcome,#lwnProfile,#lwnNicknameOverlay,#lwnRetainAsk"); }
  function whenFree(fn, tries) { tries = tries || 0; if (busy() && tries < 20) return setTimeout(function () { whenFree(fn, tries + 1); }, 1500); fn(); }

  /* Daily Challenge streak, counted in Hawaii days (same days the site uses everywhere). */
  function streak() {
    var days = {}; (get("dm-log", []) || []).forEach(function (r) { if (r && r.date) days[r.date] = 1; });
    var used = (get("lwn-freeze-v1", {}) || {}).used || []; used.forEach(function (d) { days[d] = 1; });
    var d = days[today] ? today : addDays(today, -1), n = 0;
    while (days[d]) { n++; d = addDays(d, -1); }
    return { n: n, playedToday: !!days[today] };
  }
  function chestWaiting() { var c = get("lwn-chest-v1", {}) || {}; return c.opened !== today; }
  function returning() { return (get("dm-log", []) || []).length || raw("lwn-xp-v1") || raw("lwn-badges-v1"); }

  function css() {
    if (document.getElementById("lwnRetainCss")) return;
    var s = document.createElement("style"); s.id = "lwnRetainCss";
    s.textContent =
      ".lwn-rt{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;width:min(440px,calc(100% - 32px));background:#fff;border:3px solid #F7C948;border-radius:22px;padding:16px 16px 14px;box-shadow:0 18px 48px rgba(29,59,96,.28);font-family:'Nunito',system-ui,sans-serif;color:#203D61;animation:lwnRtIn .4s ease-out}" +
      ".lwn-rt h3{margin:0 30px 6px 0;font:700 21px/1.15 'Fredoka',system-ui,sans-serif;color:#1E6FD9}" +
      ".lwn-rt ul{list-style:none;margin:6px 0 12px;padding:0;display:grid;gap:6px;font-weight:800;font-size:15px;line-height:1.3;color:#3c4566}" +
      ".lwn-rt .x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:#F1F5FB;color:#5a6788;font-size:18px;cursor:pointer}" +
      ".lwn-rt .go{display:block;text-align:center;text-decoration:none;border:0;width:100%;border-radius:15px;padding:13px;background:linear-gradient(135deg,#45b8ed,#478add);color:#fff;font:700 18px/1 'Fredoka',sans-serif;cursor:pointer}" +
      ".lwn-rt .no{display:block;width:100%;margin-top:4px;border:0;background:none;color:#72688c;font-weight:900;padding:10px;cursor:pointer;font-size:14px}" +
      ".lwn-rt .tag{display:inline-block;background:#FFF4CC;color:#8a5a00;border-radius:999px;padding:3px 10px;font-weight:900;font-size:12px;letter-spacing:.04em;margin-bottom:6px}" +
      ".lwn-rt p{margin:0 0 12px;font-weight:800;font-size:15px;line-height:1.35;color:#3c4566}.lwn-rt small{display:block;margin-top:6px;color:#7a7191;font-weight:700;font-size:12px;text-align:center}" +
      "@keyframes lwnRtIn{from{transform:translate(-50%,30px);opacity:0}to{transform:translateX(-50%);opacity:1}}" +
      "@media (prefers-reduced-motion:reduce){.lwn-rt{animation:none}}";
    document.head.appendChild(s);
  }
  function card(id, html) {
    css(); var old = document.getElementById(id); if (old) old.remove();
    var c = document.createElement("div"); c.className = "lwn-rt"; c.id = id; c.setAttribute("role", "dialog"); c.setAttribute("aria-live", "polite");
    c.innerHTML = '<button type="button" class="x" aria-label="Close">✕</button>' + html;
    c.querySelector(".x").onclick = function () { c.remove(); };
    document.body.appendChild(c); return c;
  }

  /* ---------- 1. Welcome back ---------- */
  var lastDay = get("lwn-last-day", "");
  set("lwn-last-day", today);
  function welcomeBack() {
    if (["index.html", "path.html", "games.html", "daily-challenge.html"].indexOf(page) < 0) return;
    if (!returning() || !lastDay || lastDay >= today) return;   // only on the first visit of a new day
    if (get("lwn-wb-shown", "") === today) return;
    var p = prof(), s = streak(), dow = new Date(today + "T12:00:00Z").getUTCDay();
    var lines = [];
    if (s.n > 0) lines.push("🔥 <b>" + s.n + "-day streak!</b> Play today’s Daily Challenge to keep it going.");
    else lines.push("🔥 Start a new streak today with the Daily Challenge!");
    if (chestWaiting()) lines.push("🎁 Today’s treasure chest is waiting. Play any game to unlock it!");
    if (dow >= 1 && dow <= 3) lines.push('🕵️ <a href="/case-files.html" style="color:#1E6FD9">A new Case File</a> dropped Monday. Can you solve it?');
    else lines.push('🕵️ Nini’s next <a href="/case-files.html" style="color:#1E6FD9">Case File</a> drops Monday!');
    set("lwn-wb-shown", today);
    var c = card("lwnWelcomeBack", "<h3>Welcome back" + (p.name ? ", " + esc(p.name) : "") + "! " + esc(p.avatar) + "</h3><ul>" +
      lines.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" +
      (page === "daily-challenge.html" ? '<button type="button" class="go">Let’s go! 🚀</button>' : '<a class="go" href="/daily-challenge.html">Play today’s challenge →</a>'));
    var go = c.querySelector("button.go"); if (go) go.onclick = function () { c.remove(); };
    track("welcome_back", { streak: s.n });
    setTimeout(function () { if (c.parentNode) c.remove(); }, 20000);
  }

  /* ---------- 2 + 3. Email invites for grown-ups ---------- */
  // Choice state: "yes" | "no" | "undecided" | "guest"
  function choice(md) {
    if (!md) return "guest";
    if (md.email_updates === true) return "yes";
    if (md.email_updates === false) return "no";
    return "undecided";
  }
  function getMeta() {
    if (!signedIn() || !window.LWNAccount) return Promise.resolve(null);
    return LWNAccount.session().then(function (s) { return s ? { email: s.user.email, md: s.user.user_metadata || {} } : null; }).catch(function () { return null; });
  }
  function saveChoice(yes, source) {
    return LWNAccount.setPrefs({ email_updates: !!yes, weekly_report: !!yes, email_updates_at: new Date().toISOString(), email_updates_source: source });
  }
  function askSignedIn(email, source, intro) {
    var p = prof();
    var c = card("lwnRetainAsk", '<span class="tag">FOR GROWN-UPS</span><h3>Free weekly emails? 📬</h3>' +
      "<p>" + intro + "</p><ul>" +
      "<li>📊 " + (p.name ? esc(p.name) + "’s" : "Your child’s") + " progress report every Sunday</li>" +
      "<li>🕵️ A heads-up when Nini’s new Case File drops each Monday</li></ul>" +
      '<button type="button" class="go" data-yes>Yes, email me</button><button type="button" class="no" data-no>No thanks</button>' +
      "<small>Sent to " + esc(email) + ". Unsubscribe anytime.</small>");
    track("optin_shown", { source: source });
    c.querySelector("[data-yes]").onclick = function () {
      var b = this; b.disabled = true; b.textContent = "Saving…";
      saveChoice(true, source).then(function () {
        c.innerHTML = '<h3>You’re all set! 🎉</h3><p>Look for your first report this Sunday.</p>';
        track("optin_yes", { source: source }); setTimeout(function () { c.remove(); }, 4000);
      }).catch(function () { b.disabled = false; b.textContent = "Couldn’t save. Try again"; });
    };
    c.querySelector("[data-no]").onclick = function () {
      saveChoice(false, source).catch(function () {}); track("optin_no", { source: source }); c.remove();
    };
    c.querySelector(".x").onclick = function () { track("optin_closed", { source: source }); c.remove(); };
  }
  function askGuest() {
    var p = prof();
    var c = card("lwnRetainAsk", '<span class="tag">FOR GROWN-UPS</span><h3>Want ' + (p.name ? esc(p.name) + "’s" : "your child’s") + " progress by email? 📬</h3>" +
      "<ul><li>📊 A free progress report every Sunday</li><li>🕵️ A heads-up when Nini’s new Case File drops each Monday</li><li>☁️ Streak and badges saved on every device</li></ul>" +
      '<a class="go" href="/account.html?updates=1">Get it free →</a><button type="button" class="no" data-no>Not now</button>' +
      "<small>Takes 30 seconds. A grown-up’s email is needed.</small>");
    track("optin_shown", { source: "guest" });
    c.querySelector(".go").onclick = function () { track("optin_yes", { source: "guest" }); };
    c.querySelector("[data-no]").onclick = function () { track("optin_no", { source: "guest" }); c.remove(); };
  }

  // 3. Accounts that never made a choice: ask once, on the next visit.
  function undecidedCheck() {
    if (get("lwn-optin-once", "")) return;
    getMeta().then(function (m) {
      if (!m || choice(m.md) !== "undecided") return;
      whenFree(function () {
        if (document.getElementById("lwnWelcomeBack")) document.getElementById("lwnWelcomeBack").remove();
        set("lwn-optin-once", today);
        askSignedIn(m.email, "one-time prompt", "Thanks for making a Learn With Nini account! We can now email you:");
      });
    });
  }

  // 4. Parents who said no: one friendly "look what's new" ask per season.
  var SEASON = "2026-fall-puzzle-hunts";
  function seasonalReask() {
    if (page !== "index.html") return;
    var done = get("lwn-optin-season", "");
    if (done === SEASON) return;
    var st = get("lwn-optin-ask", { n: 0, last: "" }) || { n: 0, last: "" };
    if (st.last && addDays(st.last, 7) > today) return;          // never right after another ask
    getMeta().then(function (m) {
      if (!m || choice(m.md) !== "no") return;
      var at = m.md.email_updates_at ? hiDay(new Date(m.md.email_updates_at)) : "";
      if (at && addDays(at, 7) > today) return;                  // give a fresh "no" at least a week
      setTimeout(function () {
        whenFree(function () {
          set("lwn-optin-season", SEASON);
          set("lwn-optin-ask", { n: (st.n || 0) + 1, last: today, askedNo: true });
          var p = prof(), source = "season " + SEASON;
          var faces = ["pumpkin/witch", "pumpkin/scarecrow", "thanksgiving/chef", "thanksgiving/surfer-turkey"].map(function (f) {
            return '<img src="/events/' + f + '-icon.webp" alt="" style="width:40px;height:40px;border-radius:50%;border:3px solid #fff;margin-left:-10px;box-shadow:0 2px 6px rgba(0,0,0,.15);object-fit:cover">';
          }).join("");
          var c = card("lwnRetainAsk", '<span class="tag">FOR GROWN-UPS · NEW THIS FALL</span>' +
            '<div style="margin:8px 0 4px 10px">' + faces + "</div>" +
            "<h3>Lots of new stuff on Learn With Nini! 🎉</h3><p>Want a quick email when something new drops? You can turn it off anytime.</p><ul>" +
            "<li>🧩 Puzzle hunts that unlock Nini costumes (Thanksgiving starts Nov 10)</li>" +
            "<li>📊 " + (p.name ? esc(p.name) + "’s" : "Your child’s") + " progress report every Sunday</li>" +
            "<li>🕵️ Nini’s new Case File every Monday</li></ul>" +
            '<button type="button" class="go" data-yes>Yes, email me</button><button type="button" class="no" data-no>No thanks</button>' +
            "<small>Sent to " + esc(m.email) + ". We won’t ask again this season.</small>");
          track("optin_shown", { source: source });
          c.querySelector("[data-yes]").onclick = function () {
            var b = this; b.disabled = true; b.textContent = "Saving…";
            saveChoice(true, source).then(function () {
              c.innerHTML = "<h3>Welcome back! 🎉</h3><p>You’ll hear about the Thanksgiving Puzzle Hunt and get a progress report on Sunday.</p>";
              track("optin_yes", { source: source }); setTimeout(function () { c.remove(); }, 4500);
            }).catch(function () { b.disabled = false; b.textContent = "Couldn’t save. Try again"; });
          };
          c.querySelector("[data-no]").onclick = function () { track("optin_no", { source: source }); c.remove(); };
          c.querySelector(".x").onclick = function () { track("optin_closed", { source: source }); c.remove(); };
        });
      }, 6000);
    });
  }

  // 2. After a finished game or Daily Challenge.
  var finishes = Number(get("lwn-finishes", 0)) || 0;
  function afterGame() {
    finishes++; set("lwn-finishes", finishes);
    if (finishes < 2) return;                                   // let them play a little first
    var st = get("lwn-optin-ask", { n: 0, last: "" }) || { n: 0, last: "" };
    if (st.last && addDays(st.last, 7) > today) return;         // at most once a week
    getMeta().then(function (m) {
      var ch = m ? choice(m.md) : "guest";
      if (ch === "yes" || ch === "undecided") return;           // undecided is handled by the one-time ask
      if (ch === "no") {
        if (st.askedNo) return;                                 // said no: ask again once, a week after they chose
        var at = m.md.email_updates_at ? hiDay(new Date(m.md.email_updates_at)) : "";
        if (at && addDays(at, 7) > today) return;
      } else if (st.n >= 3) return;                             // guests: 3 invitations total
      setTimeout(function () {
        whenFree(function () {
          set("lwn-optin-ask", { n: (st.n || 0) + 1, last: today, askedNo: st.askedNo || ch === "no" });
          if (ch === "no") askSignedIn(m.email, "after game", "Great playing today! Want to follow along?");
          else askGuest();
        });
      }, 2500);
    });
  }
  function hookScores() {
    var L = window.LWNLeaderboard; if (!L || typeof L.saveScore !== "function") return false;
    if (L.__retainHooked) return true;
    var orig = L.saveScore;
    L.saveScore = function (p) { try { if (!/\|dash\|/.test(String(p && p.level || ""))) afterGame(); } catch (e) {} return orig.apply(this, arguments); };
    L.__retainHooked = true; return true;
  }

  function boot() {
    setTimeout(function () { whenFree(welcomeBack); }, 1200);
    setTimeout(undecidedCheck, 3000);
    setTimeout(seasonalReask, 3500);
    if (!hookScores()) { var n = 0, iv = setInterval(function () { if (hookScores() || ++n > 40) clearInterval(iv); }, 250); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
