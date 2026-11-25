/* Learn With Nini – "Who's playing?" picker.
   Up to 4 kids can share one iPad. Each kid keeps their own name, icon, XP, streaks, puzzle pieces
   and game progress. Switching kids saves the current kid's progress on this device and loads the other's.
   A kid renaming themselves is still the same kid; switching to another kid never mixes scores. */
(function () {
  var S; try { S = window.localStorage; S.getItem("x"); } catch (e) { return; }
  var REG = "lwn-kids-v1", MAX = 4, PROF = "learningWithNiniProfileV1";
  var DEVICE = ["lwn-sound-muted", "niniBannerClosed", "lwn-vid", "lwn-sync-last", "lwn-sync-at", "lwn-sync-pulled"];
  var ICONS = ["⭐", "🦄", "🐯", "🦭", "🐼", "🦊", "🐬", "🐢", "🦋", "🐱", "🐶", "🐸", "🦖", "🚀", "🌈", "🍓", "⚽", "🎨", "👑", "🌺"];
  var COLORS = ["#7B4FD8", "#E8711A", "#1F9D55", "#1E6FD9"];

  function J(k, d) { try { var v = JSON.parse(S.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // device settings stay put when kids switch; everything else belongs to the kid playing
  function deviceKey(k) {
    return k === REG || /^lwn-kid-data-/.test(k) || /^sb-/.test(k) || /^lwn-(optin|news)/.test(k) || /^nini-install/.test(k) || DEVICE.indexOf(k) >= 0;
  }
  function kidKeys() { var out = []; for (var i = 0; i < S.length; i++) { var k = S.key(i); if (k && !deviceKey(k)) out.push(k); } return out; }
  function prof() { return J(PROF, {}) || {}; }
  function reg() {
    var r = J(REG, null), p = prof();
    if (!r || !r.kids || !r.kids.length) r = { active: "k1", kids: [{ id: "k1", name: p.name || "", avatar: p.avatar || "⭐" }] };
    // keep the playing kid's tile in step with their nickname and icon
    r.kids.forEach(function (k) { if (k.id === r.active && p.name) { k.name = p.name; k.avatar = p.avatar || k.avatar || "⭐"; } });
    return r;
  }
  function saveReg(r) { try { S.setItem(REG, JSON.stringify(r)); } catch (e) {} }

  function switchTo(id, r) {
    r = r || reg(); if (id === r.active) { close(); return; }
    var data = {}, keys = kidKeys();
    keys.forEach(function (k) { data[k] = S.getItem(k); });
    try { S.setItem("lwn-kid-data-" + r.active, JSON.stringify(data)); }
    catch (e) { alert("This iPad is out of space, so kids can't be switched right now."); return; }
    keys.forEach(function (k) { S.removeItem(k); });
    var next = J("lwn-kid-data-" + id, {}) || {};
    Object.keys(next).forEach(function (k) { if (!deviceKey(k) && next[k] != null) try { S.setItem(k, next[k]); } catch (e) {} });
    S.removeItem("lwn-kid-data-" + id);
    r.active = id; saveReg(r);
    try { sessionStorage.setItem("lwn-kid-picked", "1"); sessionStorage.removeItem("lwn-sync-pulled"); } catch (e) {}
    var go = function () { location.href = "/"; };
    try { if (window.LWNAccount && LWNAccount.push) { LWNAccount.push(true).then(go, go); setTimeout(go, 2500); return; } } catch (e) {}
    go();
  }
  function addKid(name, avatar) {
    var r = reg(), id = "k" + Date.now().toString(36);
    var data = {}; data[PROF] = JSON.stringify({ name: name, avatar: avatar, updatedAt: Date.now() });
    data.niniPlayerName = name; data.niniAvatar = avatar;
    try { S.setItem("lwn-kid-data-" + id, JSON.stringify(data)); } catch (e) { alert("This iPad is out of space."); return; }
    r.kids.push({ id: id, name: name, avatar: avatar }); saveReg(r);
    switchTo(id, r);
  }
  function removeKid(id) {
    var r = reg(); if (id === r.active || id === "k1") return;
    r.kids = r.kids.filter(function (k) { return k.id !== id; }); S.removeItem("lwn-kid-data-" + id);
    r.removed = (r.removed || []).concat([id]); saveReg(r);   // so other iPads remove them too
  }

  /* ---------- the picker ---------- */
  function css() {
    if (document.getElementById("lwnKidsCss")) return;
    var s = document.createElement("style"); s.id = "lwnKidsCss";
    s.textContent =
      "#lwnKids{position:fixed;inset:0;z-index:2147483640;background:linear-gradient(160deg,#2B1D63,#4B2FA8 60%,#6A3FD4);display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;font-family:'Nunito',system-ui,sans-serif;color:#fff}" +
      "#lwnKids .in{width:min(640px,100%);text-align:center}" +
      "#lwnKids h2{font:700 clamp(30px,7vw,44px)/1.1 'Fredoka',sans-serif;margin:0 0 6px}" +
      "#lwnKids .sub{font-weight:800;opacity:.85;margin:0 0 22px}" +
      "#lwnKids .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:16px;justify-items:center}" +
      "#lwnKids .kid{position:relative;background:none;border:0;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;font:800 18px/1.2 'Nunito',sans-serif;padding:6px;max-width:150px}" +
      "#lwnKids .av{width:118px;height:118px;border-radius:26px;display:grid;place-items:center;font-size:62px;box-shadow:0 10px 24px rgba(0,0,0,.25);border:4px solid transparent;transition:transform .15s}" +
      "#lwnKids .kid:active .av,#lwnKids .kid:hover .av{transform:scale(1.05);border-color:#fff}" +
      "#lwnKids .kid.on .av{border-color:#FFD84D}" +
      "#lwnKids .now{position:absolute;top:0;left:50%;transform:translateX(-50%);background:#FFD84D;color:#5A3D00;font-size:12px;font-weight:900;padding:2px 9px;border-radius:999px;white-space:nowrap}" +
      "#lwnKids .add .av{background:rgba(255,255,255,.14);border:3px dashed rgba(255,255,255,.6);font-size:48px;box-shadow:none}" +
      "#lwnKids .x{position:absolute;top:-4px;right:6px;width:36px;height:36px;border-radius:50%;background:#C8322F;color:#fff;border:3px solid #fff;font-weight:900;font-size:18px;display:grid;place-items:center}" +
      "#lwnKids .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px}" +
      "#lwnKids .row button{min-height:48px;border-radius:999px;border:2px solid rgba(255,255,255,.55);background:transparent;color:#fff;font:800 16px/1 'Nunito',sans-serif;padding:0 18px;cursor:pointer}" +
      "#lwnKids .row button.main{background:#FFD84D;color:#4A3200;border-color:#FFD84D}" +
      "#lwnKids form{background:#fff;color:#203D61;border-radius:24px;padding:18px;text-align:left;margin-top:6px}" +
      "#lwnKids label{font-weight:900;display:block;margin:0 0 6px}" +
      "#lwnKids input{width:100%;min-height:52px;border-radius:14px;border:3px solid #CFC2F2;font:800 20px/1 'Nunito',sans-serif;padding:0 14px;color:#4B3A9E;box-sizing:border-box}" +
      "#lwnKids .icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:6px;margin:8px 0 14px}" +
      "#lwnKids .icons button{min-height:48px;border-radius:12px;border:2px solid #E1EAF6;background:#FAF9FF;font-size:24px;cursor:pointer}" +
      "#lwnKids .icons button.on{border-color:#7B4FD8;background:#F1ECFF}" +
      "#lwnKids .err{color:#C8322F;font-weight:800;min-height:20px;margin:6px 0 0}" +
      "#lwnKids .go{width:100%;min-height:54px;border:0;border-radius:16px;background:linear-gradient(135deg,#9F7CF5,#5B3FC4);color:#fff;font:700 20px/1 'Fredoka',sans-serif;cursor:pointer;margin-top:6px}" +
      ".lwn-who{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:4px 12px 4px 4px;border-radius:999px;border:2px solid #DCD2F7;background:#F6F2FF;color:#4B3A9E;cursor:pointer;font-family:'Nunito',sans-serif;text-align:left;max-width:210px;flex:none;margin-left:auto}" +
      ".lwn-who .a{width:36px;height:36px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:22px;flex:none;box-shadow:0 1px 3px rgba(0,0,0,.1)}" +
      ".lwn-who .t{display:flex;flex-direction:column;min-width:0;line-height:1.1}.lwn-who b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lwn-who small{font-size:11px;font-weight:800;color:#7B4FD8}" +
      ".lwn-whorow{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin:12px 0 -4px;font:800 15px/1 'Nunito',sans-serif;color:#61708A}.lwn-whorow .lwn-who{margin-left:0;max-width:260px}" +
      "@media(max-width:600px){.lwn-whorow .lwn-who{padding:4px 12px 4px 4px}.lwn-whorow .lwn-who .t{display:flex}}" +
      "@media(max-width:600px){.lwn-who{padding:4px}.lwn-who .t{display:none}}" +
      ".lwn-kidbtn{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:8px 6px 0;padding:6px 14px;border-radius:999px;border:2px solid #DCD2F7;background:#F6F2FF;color:#4B3A9E;font:800 15px/1 'Nunito',sans-serif;cursor:pointer}";
    document.head.appendChild(s);
  }
  var manage = false;
  function close() { var w = document.getElementById("lwnKids"); if (w) w.remove(); document.documentElement.style.overflow = ""; }
  function open() {
    css(); close(); manage = false;
    var w = document.createElement("div"); w.id = "lwnKids"; w.setAttribute("role", "dialog"); w.setAttribute("aria-label", "Who's playing?");
    document.body.appendChild(w); document.documentElement.style.overflow = "hidden";
    drawList(w);
  }
  function drawList(w) {
    var r = reg();
    w.innerHTML = '<div class="in"><h2>Who’s playing?</h2><p class="sub">' + (r.kids.length > 1 ? "Tap your picture. Each kid keeps their own stars and streaks." : "Add a brother, sister or friend who shares this iPad.") + '</p><div class="grid">' +
      r.kids.map(function (k, i) {
        var on = k.id === r.active;
        return '<button type="button" class="kid' + (on ? " on" : "") + '" data-id="' + k.id + '">' + (on && !manage ? '<span class="now">Playing now</span>' : "") +
          (manage && !on && k.id !== "k1" ? '<span class="x" aria-hidden="true">✕</span>' : "") +
          '<span class="av" style="background:' + COLORS[i % 4] + '">' + esc(k.avatar || "⭐") + '</span>' + esc(k.name || "Player") + "</button>";
      }).join("") +
      (r.kids.length < MAX && !manage ? '<button type="button" class="kid add" data-add="1"><span class="av">➕</span>Add a kid</button>' : "") +
      '</div><div class="row">' + (r.kids.length > 1 ? '<button type="button" data-manage="1">' + (manage ? "Done" : "✏️ Manage kids") + "</button>" : "") +
      '<button type="button" class="main" data-close="1">' + (manage ? "Close" : "Keep playing as " + esc((r.kids.filter(function (k) { return k.id === r.active; })[0] || {}).name || "me")) + "</button></div>" +
      (manage ? '<p class="sub" style="margin-top:14px">Tap ✕ to remove a kid from this iPad. Their progress here is deleted. To rename someone, switch to them and tap “Change my icon”.</p>' : "") + "</div>";
    w.querySelectorAll(".kid[data-id]").forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.id;
        if (manage) {
          var k = reg().kids.filter(function (x) { return x.id === id; })[0];
          if (!k || id === reg().active || id === "k1") return;
          if (confirm("Remove " + (k.name || "this kid") + " from this iPad? Their stars and progress on this iPad will be deleted.")) { removeKid(id); drawList(w); }
          return;
        }
        switchTo(id);
      };
    });
    var add = w.querySelector("[data-add]"); if (add) add.onclick = function () { drawAdd(w); };
    var m = w.querySelector("[data-manage]"); if (m) m.onclick = function () { manage = !manage; drawList(w); };
    w.querySelector("[data-close]").onclick = close;
  }
  function drawAdd(w) {
    var pick = ICONS[Math.floor(Math.random() * ICONS.length)];
    w.innerHTML = '<div class="in"><h2>Add a kid</h2><p class="sub">Use a nickname, not their full real name.</p><form novalidate>' +
      '<label for="lwnKidName">Nickname</label><input id="lwnKidName" maxlength="24" autocomplete="off" autocapitalize="words" placeholder="Like Kai or Super Ellie">' +
      '<label style="margin-top:14px">Pick an icon</label><div class="icons">' + ICONS.map(function (a) { return '<button type="button" data-av="' + a + '" class="' + (a === pick ? "on" : "") + '">' + a + "</button>"; }).join("") + "</div>" +
      '<button class="go" type="submit">Start playing ▶</button><p class="err" id="lwnKidErr"></p></form>' +
      '<div class="row"><button type="button" data-back="1">← Back</button></div></div>';
    w.querySelectorAll("[data-av]").forEach(function (b) { b.onclick = function () { pick = b.dataset.av; w.querySelectorAll("[data-av]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    w.querySelector("[data-back]").onclick = function () { drawList(w); };
    var inp = w.querySelector("#lwnKidName"); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    w.querySelector("form").onsubmit = function (e) {
      e.preventDefault();
      var name = String(inp.value || "").trim().replace(/\s+/g, " ").slice(0, 24), err = w.querySelector("#lwnKidErr");
      if (!name) { err.textContent = "Type a nickname first."; inp.focus(); return; }
      if (reg().kids.some(function (k) { return String(k.name || "").trim().toLowerCase() === name.toLowerCase(); })) { err.textContent = "Someone here already has that name. Try another one!"; return; }
      addKid(name, pick);
    };
  }

  /* ---------- where to find it ---------- */
  function homeButton() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page !== "index.html") return;
    var me = document.getElementById("lwnMe");
    if (!me) { if ((homeButton.tries = (homeButton.tries || 0) + 1) < 20) setTimeout(homeButton, 250); return; }
    if (document.getElementById("lwnKidBtn")) return;
    css();
    var r = reg(), b = document.createElement("button"); b.type = "button"; b.id = "lwnKidBtn"; b.className = "lwn-kidbtn";
    b.innerHTML = r.kids.length > 1 ? "👥 Switch kid" : "👥 Add a kid";
    b.onclick = open; me.insertAdjacentElement("afterend", b);
    // Netflix style: ask who's playing the first time the homepage opens in a visit
    var asked = false; try { asked = sessionStorage.getItem("lwn-kid-picked") === "1"; } catch (e) {}
    if (r.kids.length > 1 && !asked) { try { sessionStorage.setItem("lwn-kid-picked", "1"); } catch (e) {} open(); }
  }
  // Always-visible "who's playing" pill at the top of the page: tap it to switch kids
  function topPill() {
    if (document.getElementById("lwnWho")) return;
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase(), today = document.getElementById("lwnToday");
    var host = page === "index.html" ? today : document.querySelector("header.top");
    if (!host) { if (page === "index.html" && (topPill.tries = (topPill.tries || 0) + 1) < 40) setTimeout(topPill, 250); return; }
    css();
    var r = reg(), me = r.kids.filter(function (k) { return k.id === r.active; })[0] || {}, p = prof();
    var b = document.createElement("button"); b.type = "button"; b.id = "lwnWho"; b.className = "lwn-who";
    b.setAttribute("aria-label", "Who's playing? Switch kid");
    b.innerHTML = '<span class="a">' + esc(p.avatar || me.avatar || "🙂") + '</span><span class="t"><b>' + esc(p.name || me.name || "Me") + '</b><small>' + (r.kids.length > 1 ? "Switch kid ▾" : "Add a kid ▾") + "</small></span>";
    b.onclick = open;
    if (host === today) { // homepage: a row right above Today with Nini
      var row = document.createElement("div"); row.className = "lwn-whorow"; row.innerHTML = "<span>Playing now:</span>"; row.appendChild(b);
      today.parentNode.insertBefore(row, today);
    } else { var sc = host.querySelector(".sc"); if (sc) host.insertBefore(b, sc); else host.appendChild(b); }
  }
  saveReg(reg());
  window.LWNKids = { open: open, list: function () { return reg().kids; }, active: function () { return reg().active; }, isMain: function () { return reg().active === "k1"; } };
  function boot() { homeButton(); topPill(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
