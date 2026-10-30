/* Learn With Nini – parent accounts.
   A parent signs in with email + password. The child's progress on this device (streak, badges, XP, path,
   settings) is saved to their private row in Supabase and merged back on any device they sign in on. */
(function () {
  if (window.LWNAccount) return;
  var URL = "https://wvcdihtphcjuegdkadsb.supabase.co";
  var KEY = "sb_publishable_Uso8SKT30uVsIDPxTzroIQ_kMCWOoaN";
  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  // Keys that are about this device only and should never be copied between devices.
  var SKIP = /^(sb-|lwnGlobalDeviceId$|niniBannerClosed$|lwn-sync-|lwn-event-preview$)/;

  var recovering = /(?:^|[&#])type=recovery(?:&|$)/.test(location.hash);
  var client = null, readyP = null;
  function sdk() {
    if (readyP) return readyP;
    readyP = new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) return res();
      var s = document.createElement("script"); s.src = SDK; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    }).then(function () {
      client = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "sb-lwn-auth" } });
      client.auth.onAuthStateChange(function (event) { if (event === "PASSWORD_RECOVERY") recovering = true; });
      return client;
    });
    return readyP;
  }

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function json(v, d) { try { var x = JSON.parse(v); return x == null ? d : x; } catch (e) { return d; } }

  function snapshot() {
    var out = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (!SKIP.test(k)) out[k] = localStorage.getItem(k); } } catch (e) {}
    return out;
  }
  function hasProgress(snap) { return !!(snap["dm-log"] && snap["dm-log"] !== "[]") || !!snap["lwn-xp-v1"] || !!snap["lwn-badges-v1"]; }

  /* ---------- merging two devices' progress ---------- */
  function mergeLog(a, b) {
    var seen = {}, out = [];
    json(a, []).concat(json(b, [])).forEach(function (x) {
      if (!x) return; var k = [x.date, x.grade, x.mode, x.mins, x.points, x.correct, x.attempted, x.secs].join("|");
      if (!seen[k]) { seen[k] = 1; out.push(x); }
    });
    out.sort(function (x, y) { return String(x.date).localeCompare(String(y.date)); });
    return JSON.stringify(out);
  }
  function mergeBadges(a, b) {
    var x = json(a, {}), y = json(b, {}), out = {};
    Object.keys(x).concat(Object.keys(y)).forEach(function (k) {
      var d1 = x[k], d2 = y[k]; out[k] = d1 && d2 ? (d1 < d2 ? d1 : d2) : (d1 || d2);
    });
    return JSON.stringify(out);
  }
  function maxMap(x, y) { var o = {}; Object.keys(x || {}).concat(Object.keys(y || {})).forEach(function (k) { o[k] = Math.max(Number((x || {})[k]) || 0, Number((y || {})[k]) || 0); }); return o; }
  function union(a, b) { var s = {}; (a || []).concat(b || []).forEach(function (v) { s[v] = 1; }); return Object.keys(s).sort(); }
  function mergeXP(a, b) {
    var x = json(a, {}), y = json(b, {});
    return JSON.stringify({ days: maxMap(x.days, y.days), games: maxMap(x.games, y.games), last: Object.assign({}, y.last || {}, x.last || {}),
      dailyDone: Math.max(x.dailyDone || 0, y.dailyDone || 0), goal: x.goal || y.goal || 30, goalDays: union(x.goalDays, y.goalDays) });
  }
  function mergeFreeze(a, b) {
    var x = json(a, {}), y = json(b, {});
    return JSON.stringify({ have: Math.max(x.have || 0, y.have || 0), used: union(x.used, y.used), earned: union(x.earned, y.earned), notice: x.notice || y.notice });
  }
  // Nickname + icon: the most recently changed one wins (ties keep this device's).
  function newerProfile(a, b) { var x = json(a, {}), y = json(b, {}); return (Number(y.updatedAt) || 0) > (Number(x.updatedAt) || 0) ? b : a; }
  function mergeEvent(a, b) {
    var x = json(a, {}), y = json(b, {});
    var out = { n: Math.max(Number(x.n) || 0, Number(y.n) || 0), days: maxMap(x.days, y.days), daily: union(x.daily, y.daily) };
    if (x.have || y.have) out.have = maxMap(x.have, y.have);   // pieces per costume; event.js fills in any older "n"-only progress
    out.cur = x.cur || y.cur || null;                            // this device's pick wins
    return JSON.stringify(out);
  }
  function merge(local, cloud) {
    var out = {};
    Object.keys(cloud || {}).concat(Object.keys(local || {})).forEach(function (k) {
      var l = local[k], c = (cloud || {})[k];
      if (l == null) out[k] = c; else if (c == null) out[k] = l;
      else if (k === "dm-log") out[k] = mergeLog(l, c);
      else if (k === "lwn-badges-v1") out[k] = mergeBadges(l, c);
      else if (k === "lwn-xp-v1") out[k] = mergeXP(l, c);
      else if (k === "lwn-freeze-v1") out[k] = mergeFreeze(l, c);
      else if (k === "learningWithNiniProfileV1") out[k] = newerProfile(l, c);
      else if (k === "lwn-icons-v1" || k === "lwn-postcards-v1") out[k] = JSON.stringify(union(json(l, []), json(c, [])));
      else if (k === "lwn-boss-v1") { var bx = json(l, {}), by = json(c, {}), bo = {}; Object.keys(bx).concat(Object.keys(by)).forEach(function (q) { bo[q] = !!(bx[q] || by[q]); }); out[k] = JSON.stringify(bo); }
      else if (k === "lwn-skills-v1") { var sx = json(l, {}), sy = json(c, {}), so = {}; Object.keys(sx).concat(Object.keys(sy)).forEach(function (d) { var a = sx[d] || {}, b2 = sy[d] || {}, o = so[d] = {}; Object.keys(a).concat(Object.keys(b2)).forEach(function (t) { var p = a[t] || [0, 0], q2 = b2[t] || [0, 0]; o[t] = p[1] >= q2[1] ? p : q2; }); }); out[k] = JSON.stringify(so); }
      else if (/^lwn-event-(?!preview$)/.test(k)) out[k] = mergeEvent(l, c);
      else if (k === "lwn-league-best") out[k] = String(Math.max(Number(json(l, 0)) || 0, Number(json(c, 0)) || 0));
      else out[k] = l; // this device's choice wins for settings and everything else
    });
    // keep the older name/icon copies in step with the winning profile
    var prof = json(out["learningWithNiniProfileV1"], null);
    if (prof && prof.name) { out["niniPlayerName"] = prof.name; out["niniAvatar"] = prof.avatar || "⭐"; }
    return out;
  }

  /* ---------- syncing ---------- */
  var lastPushed = get("lwn-sync-last") || "";
  function signature(snap) { return String(JSON.stringify(snap).length) + ":" + JSON.stringify(snap).slice(-200); }
  function session() { return sdk().then(function (c) { return c.auth.getSession(); }).then(function (r) { return r.data && r.data.session; }); }

  function push(force) {
    return session().then(function (s) {
      if (!s) return false;
      var snap = snapshot(), sig = signature(snap);
      if (!force && sig === lastPushed) return true;
      return client.from("player_progress").upsert({ user_id: s.user.id, data: snap, updated_at: new Date().toISOString() })
        .then(function (r) { if (r.error) throw r.error; lastPushed = sig; set("lwn-sync-last", sig); set("lwn-sync-at", new Date().toISOString()); return true; });
    });
  }
  // Pull the cloud copy, merge it with this device, save both. Returns true if this device's data changed.
  function pullMerge() {
    return session().then(function (s) {
      if (!s) return false;
      return client.from("player_progress").select("data").eq("user_id", s.user.id).maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        var local = snapshot(), cloud = (r.data && r.data.data) || {};
        var merged = merge(local, cloud), changed = false;
        Object.keys(merged).forEach(function (k) { if (merged[k] != null && merged[k] !== local[k]) { set(k, merged[k]); changed = true; } });
        return push(true).then(function () { return changed; });
      });
    });
  }

  // emailUpdates: the parent ticked "send me updates" (optional, off by default)
  function signUp(email, password, emailUpdates, weeklyReport) {
    var meta = { email_updates: !!emailUpdates, email_updates_at: new Date().toISOString(), email_updates_source: "signup", weekly_report: weeklyReport !== false };
    return sdk().then(function (c) { return c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: "https://learnwithnini.com/account.html", data: meta } }); })
      .then(function (r) { if (r.error) throw r.error; return { needsConfirm: !r.data.session }; });
  }
  function signIn(email, password) {
    return sdk().then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); })
      .then(function (r) { if (r.error) throw r.error; return r.data.session; });
  }
  // Turn email updates on or off for a signed-in parent
  function setEmailUpdates(on) {
    return sdk().then(function (c) { return c.auth.updateUser({ data: { email_updates: !!on, email_updates_at: new Date().toISOString(), email_updates_source: "account page" } }); })
      .then(function (r) { if (r.error) throw r.error; return !!on; });
  }
  function setPrefs(data) {
    return sdk().then(function (c) { return c.auth.updateUser({ data: data }); }).then(function (r) { if (r.error) throw r.error; return true; });
  }
  function signOut() { return push(true).catch(function () {}).then(function () { return client.auth.signOut(); }); }

  // Background sync on every page for signed-in families (cheap: one small request).
  function auto() {
    if (recovering) return;
    if (!get("sb-lwn-auth")) return; // never signed in on this device — don't even load the SDK
    var key = "lwn-sync-pulled";
    var first = !sessionStorage.getItem(key);
    var job = first ? pullMerge().then(function (changed) {
      try { sessionStorage.setItem(key, "1"); } catch (e) {}
      if (changed && !/account\.html$/.test(location.pathname)) location.reload();
    }) : push(false);
    job.catch(function () {});
    setInterval(function () { push(false).catch(function () {}); }, 60000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") push(false).catch(function () {}); });
  }

  /* ---------- "save your progress" prompts (hidden once signed in) ---------- */
  function signedIn() { var t = json(get("sb-lwn-auth"), null); return !!(t && (t.refresh_token || (t.currentSession && t.currentSession.refresh_token))); }
  function promptCSS() {
    if (document.getElementById("lwn-acct-css")) return;
    var s = document.createElement("style"); s.id = "lwn-acct-css";
    s.textContent =
      ".lwn-save{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,#FFF7D7,#ECF5FF);border:2px solid #F7C948;border-radius:18px;padding:12px 14px;margin:12px 0;text-decoration:none;color:#1d3c63;font-family:'Nunito',system-ui,sans-serif}" +
      ".lwn-save .i{font-size:30px;flex:none}.lwn-save b{display:block;font:700 17px/1.15 'Fredoka',system-ui,sans-serif;color:#3574c1}" +
      ".lwn-save span{display:block;font-weight:800;font-size:13px;color:#6e6688;line-height:1.3}.lwn-save .go{margin-left:auto;flex:none;background:linear-gradient(135deg,#45b8ed,#478add);color:#fff;border-radius:12px;padding:9px 12px;font:700 15px/1 'Fredoka',sans-serif;white-space:nowrap}" +
      ".lwn-signin-btn{white-space:nowrap}@media(max-width:560px){#lwnSignInBtn{display:none!important}}" +
      ".lwn-hero-acct{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font:800 15px/1.2 'Nunito',system-ui,sans-serif;color:#3574c1;text-decoration:none;background:#fff;border:2px solid #DFE9F5;border-radius:999px;padding:9px 14px}";
    document.head.appendChild(s);
  }
  function saveCard(title, sub) {
    promptCSS();
    var a = document.createElement("a"); a.className = "lwn-save"; a.href = "/account.html";
    a.innerHTML = '<span class="i">☁️</span><div><b>' + title + "</b><span>" + sub + '</span></div><span class="go">Save it →</span>';
    return a;
  }
  function prompts() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var inNow = signedIn();
    // Homepage header button
    var actions = document.querySelector(".header-actions");
    if (actions && !document.getElementById("lwnSignInBtn")) {
      promptCSS();
      var b = document.createElement("a"); b.id = "lwnSignInBtn"; b.href = "/account.html";
      var cls = actions.querySelector(".leaderboard-btn"); b.className = (cls ? cls.className : "") + " lwn-signin-btn";
      b.setAttribute("aria-label", inNow ? "Parent account" : "Parent sign in");
      b.innerHTML = "<span>👤</span><span class='leaderboard-label'>" + (inNow ? "Account" : "Sign in") + "</span>";
      actions.insertBefore(b, actions.firstChild);
    }
    // Homepage hero: a clear link under the main button (always visible on phones)
    var heroActions = document.querySelector(".hero-actions");
    if (heroActions && !document.getElementById("lwnHeroAcct")) {
      promptCSS();
      var h = document.createElement("a"); h.id = "lwnHeroAcct"; h.className = "lwn-hero-acct"; h.href = "/account.html";
      h.textContent = inNow ? "👤 Parent account · progress saved ✓" : "👤 Parents: sign in to save progress";
      heroActions.insertAdjacentElement("afterend", h);
    }
    if (inNow) return;
    // My Path page
    if (page === "path.html") {
      var ov = document.querySelector(".overall");
      if (ov && !document.getElementById("lwnSavePath")) {
        var c = saveCard("Don’t lose your path!", "Grown-ups: a free account saves progress on every device.");
        c.id = "lwnSavePath"; ov.insertAdjacentElement("afterend", c);
      }
    }
    // Daily Challenge results screen
    var done = document.querySelector("#done .done");
    if (done && !document.getElementById("lwnSaveDone")) {
      var show = function () {
        if (!document.getElementById("done").classList.contains("on") || document.getElementById("lwnSaveDone")) return;
        var c2 = saveCard("Save your streak! 🔥", "Ask a grown-up to make a free account so your streak and badges are never lost.");
        c2.id = "lwnSaveDone";
        var after = document.getElementById("stats") || done.firstChild;
        after.insertAdjacentElement("afterend", c2);
      };
      new MutationObserver(show).observe(document.getElementById("done"), { attributes: true, attributeFilter: ["class"] });
      show();
    }
  }

  window.LWNAccount = { isRecovering: function () { return recovering; }, sdk: sdk, session: session, signUp: signUp, signIn: signIn, signOut: signOut, setEmailUpdates: setEmailUpdates, setPrefs: setPrefs, pullMerge: pullMerge, push: push,
    lastSync: function () { return get("lwn-sync-at"); }, _merge: merge };
  function boot() { auto(); try { prompts(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
