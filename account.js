/* Learn With Nini – parent accounts.
   A parent signs in with email + password. The child's progress on this device (streak, badges, XP, path,
   settings) is saved to their private row in Supabase and merged back on any device they sign in on. */
(function () {
  if (window.LWNAccount) return;
  var URL = "https://wvcdihtphcjuegdkadsb.supabase.co";
  var KEY = "sb_publishable_Uso8SKT30uVsIDPxTzroIQ_kMCWOoaN";
  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  // Keys that are about this device only and should never be copied between devices.
  var SKIP = /^(sb-|lwnGlobalDeviceId$|niniBannerClosed$|lwn-sync-)/;

  var client = null, readyP = null;
  function sdk() {
    if (readyP) return readyP;
    readyP = new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) return res();
      var s = document.createElement("script"); s.src = SDK; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    }).then(function () {
      client = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "sb-lwn-auth" } });
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
  function merge(local, cloud) {
    var out = {};
    Object.keys(cloud || {}).concat(Object.keys(local || {})).forEach(function (k) {
      var l = local[k], c = (cloud || {})[k];
      if (l == null) out[k] = c; else if (c == null) out[k] = l;
      else if (k === "dm-log") out[k] = mergeLog(l, c);
      else if (k === "lwn-badges-v1") out[k] = mergeBadges(l, c);
      else if (k === "lwn-xp-v1") out[k] = mergeXP(l, c);
      else if (k === "lwn-freeze-v1") out[k] = mergeFreeze(l, c);
      else out[k] = l; // this device's choice wins for settings, nickname and everything else
    });
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

  function signUp(email, password) {
    return sdk().then(function (c) { return c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: "https://learnwithnini.com/account.html" } }); })
      .then(function (r) { if (r.error) throw r.error; return { needsConfirm: !r.data.session }; });
  }
  function signIn(email, password) {
    return sdk().then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); })
      .then(function (r) { if (r.error) throw r.error; return r.data.session; });
  }
  function signOut() { return push(true).catch(function () {}).then(function () { return client.auth.signOut(); }); }

  // Background sync on every page for signed-in families (cheap: one small request).
  function auto() {
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

  window.LWNAccount = { sdk: sdk, session: session, signUp: signUp, signIn: signIn, signOut: signOut, pullMerge: pullMerge, push: push,
    lastSync: function () { return get("lwn-sync-at"); }, _merge: merge };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
