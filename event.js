/* Learn With Nini – seasonal puzzle events (Pumpkin Patch mini hunt, then the Thanksgiving Puzzle Hunt).
   Finish a game round = 1 puzzle piece, finish the Daily Challenge = 2 pieces, max 3 pieces a day.
   4 pieces finish a picture and unlock that costume as the player's icon.
   Only one event earns pieces at a time (the one whose dates include today). Each event saves to its own
   localStorage key ("lwn-event-<id>"), which syncs with parent accounts (see account.js merge).
   Preview: add ?eventpreview=<event id> to any page (for example ?eventpreview=thanksgiving-2026);
   ?eventpreview=0 turns it off. Preview only affects this device. */
(function () {
  if (window.LWNEvent) return;
  var EVENTS = [
    {
      id: "pumpkin-2026",
      name: "Pumpkin Patch Puzzle Hunt", short: "Pumpkin Patch",
      start: "2026-10-29", end: "2026-11-09",        // Hawaiʻi dates, both days included
      dates: "Now – November 9",
      page: "/pumpkin-patch.html", dir: "/events/pumpkin/",
      emoji: "🎃", certificate: false, next: "thanksgiving-2026",
      costumes: [
        { id: "witch", name: "Witch Nini", token: "🧙✨" },
        { id: "scarecrow", name: "Scarecrow Nini", token: "🌾✨" },
        { id: "pumpkin-trex", name: "Pumpkin T-Rex", token: "🦖✨" },
        { id: "pirate-honu", name: "Pirate Honu", token: "🐢✨" },
        { id: "boo-ghost", name: "Boo the Ghost", token: "👻✨" },
        { id: "vampire-kid", name: "Vampire Kid", token: "🧛✨" }
      ]
    },
    {
      id: "thanksgiving-2026",
      name: "Thanksgiving Puzzle Hunt", short: "Thanksgiving",
      start: "2026-11-10", end: "2026-11-30",
      dates: "November 10–30",
      page: "/thanksgiving.html", dir: "/events/thanksgiving/",
      emoji: "🦃", certificate: true,
      costumes: [
        { id: "chef", name: "Chef Nini", token: "🥧✨" },
        { id: "pilgrim", name: "Pilgrim Nini", token: "🌽✨" },
        { id: "football", name: "Football Nini", token: "🏈✨" },
        { id: "surfer-turkey", name: "Surfer Turkey Nini", token: "🦃✨" },
        { id: "touchdown-turkey", name: "Touchdown Turkey", token: "🦃🏆✨" }
      ]
    }
  ];
  var PER_DAY = 3, PER_COSTUME = 4, PREVIEW = "lwn-event-preview";

  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function today() {
    try { if (window.LWNXP && LWNXP.hawaiiToday) return LWNXP.hawaiiToday(); } catch (e) {}
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date()).forEach(function (x) { if (x.type !== "literal") p[x.type] = x.value; });
    return p.year + "-" + p.month + "-" + p.day;
  }
  try {
    var q = new URLSearchParams(location.search).get("eventpreview");
    if (q === "0") localStorage.removeItem(PREVIEW); else if (q) localStorage.setItem(PREVIEW, q);
  } catch (e) {}
  function previewId() { try { return localStorage.getItem(PREVIEW) || ""; } catch (e) { return ""; } }

  // "3/4", plus the simpler fraction when there is one
  function fractionText(have) {
    if (have === 2) return "2/4 = 1/2";
    if (have === 4) return "4/4 = 1 whole";
    return have + "/4";
  }

  /* ---------- one event ---------- */
  function make(EV) {
    var TOTAL = EV.costumes.length * PER_COSTUME, KEY = "lwn-event-" + EV.id;
    function phase() {
      var d = today(), pv = previewId();
      if (pv === EV.id) return "on";
      if (d > EV.end) return "over";
      if (d >= EV.start) return "on";
      return "soon";
    }
    function daysLeft() { var a = new Date((today() < EV.start ? EV.start : today()) + "T12:00:00Z"), b = new Date(EV.end + "T12:00:00Z"); return Math.max(0, Math.round((b - a) / 864e5) + 1); }
    // Saved state: have = pieces per costume {id: 0-4}, cur = the puzzle the kid picked to work on next.
    // Older saves only had n (a total, filled in costume order); those are converted here.
    function st() {
      var s = get(KEY, {}); if (!s || typeof s !== "object") s = {};
      s.days = s.days || {}; s.daily = s.daily || []; s.have = s.have && typeof s.have === "object" ? s.have : {};
      var sum = 0; EV.costumes.forEach(function (c) { s.have[c.id] = Math.max(0, Math.min(PER_COSTUME, Number(s.have[c.id]) || 0)); sum += s.have[c.id]; });
      var extra = Math.min(TOTAL, Number(s.n) || 0) - sum;            // pieces counted on an older device/version
      EV.costumes.forEach(function (c) { while (extra > 0 && s.have[c.id] < PER_COSTUME) { s.have[c.id]++; extra--; sum++; } });
      s.n = sum;
      if (s.cur && !EV.costumes.some(function (c) { return c.id === s.cur; })) s.cur = null;
      return s;
    }
    function todayCount() { return st().days[today()] || 0; }
    function haveOf(c, s) { return (s || st()).have[c.id] || 0; }
    function unlockedCount(s) { s = s || st(); return EV.costumes.filter(function (c) { return s.have[c.id] >= PER_COSTUME; }).length; }
    function isDone(c, s) { return haveOf(c, s) >= PER_COSTUME; }
    // The puzzle the next piece goes to: the kid's pick, else one already started, else the first unfinished one
    function target(s) {
      s = s || st();
      var pick = EV.costumes.filter(function (c) { return c.id === s.cur && !isDone(c, s); })[0];
      if (pick) return pick;
      return EV.costumes.filter(function (c) { return s.have[c.id] > 0 && !isDone(c, s); })[0] || EV.costumes.filter(function (c) { return !isDone(c, s); })[0] || null;
    }
    function setCur(id) { var s = st(); s.cur = id; set(KEY, s); try { window.dispatchEvent(new CustomEvent("lwn:piece", { detail: { event: EV.id, pick: id } })); } catch (e) {} }
    function icon(c) { return EV.dir + c.id + "-icon.webp"; }
    function pic(c) { return EV.dir + c.id + ".webp"; }

    function earn(k, why) {
      if (phase() !== "on") return 0;
      var s = st(), d = today(), used = s.days[d] || 0;
      var got = Math.max(0, Math.min(k, PER_DAY - used, TOTAL - s.n));
      if (!got) return 0;
      var before = s.n, items = [];
      for (var i = 0; i < got; i++) {
        var c = target(s); if (!c) break;
        s.have[c.id]++; s.n++;
        if (s.have[c.id] >= PER_COSTUME && s.cur === c.id) s.cur = null;
        items.push({ c: c, have: s.have[c.id], all: s.n >= TOTAL });
      }
      s.days[d] = used + got;
      Object.keys(s.days).sort().slice(0, -40).forEach(function (x) { delete s.days[x]; });
      set(KEY, s);
      try { window.dispatchEvent(new CustomEvent("lwn:piece", { detail: { event: EV.id, before: before, after: s.n, why: why || "" } })); } catch (e) {}
      try { if (window.LWNAccount && LWNAccount.push) LWNAccount.push().catch(function () {}); } catch (e) {}
      setTimeout(function () { popup(api, items); }, 1100);
      return got;
    }
    function earnDaily() {
      var s = st(), d = today();
      if (phase() !== "on" || s.daily.indexOf(d) >= 0) return 0;
      s.daily.push(d); s.daily = s.daily.slice(-40); set(KEY, s);
      return earn(2, "daily");
    }

    // A 2×2 puzzle of one costume with `have` pieces showing (order: top-left, top-right, bottom-left, bottom-right)
    function puzzleHtml(c, have, fresh) {
      var pos = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];
      return '<div class="lwn-puz' + (have >= 4 ? " done" : "") + '" role="img" aria-label="' + esc(c.name) + " puzzle: " + have + ' of 4 pieces">' +
        pos.map(function (p, i) {
          var on = i < have;
          return '<i class="' + (on ? "" : "off") + (on && fresh && i === have - 1 ? " new" : "") + '" style="background-image:url(' + pic(c) + ");background-position:" + p + '"></i>';
        }).join("") + pos.map(function (p, i) {
          return i < have ? "" : '<b style="left:' + (i % 2 ? "50%" : "0") + ";top:" + (i < 2 ? "0" : "50%") + ';width:50%;height:50%">🧩</b>';
        }).join("") + "</div>";
    }

    function pickerHtml(avatar) {
      var ph = phase(), s = st(), n = unlockedCount(s);
      if (ph === "soon" && !n) return "";
      if (ph === "over" && !n) return "";
      return '<div class="lbl">' + EV.emoji + " " + esc(EV.short) + ' costumes <span style="color:#7a7191;font-weight:800">(' + n + " of " + EV.costumes.length + ")</span></div>" +
        '<div class="av">' + EV.costumes.map(function (c, i) {
          return isDone(c, s)
            ? '<button type="button" data-av="' + c.token + '" class="' + (c.token === avatar ? "on" : "") + '" aria-label="' + esc(c.name) + '">' + c.token + "</button>"
            : '<button type="button" class="lock" data-lock="' + esc(ph === "over" ? "The event is over. This one was a " + EV.short + " prize" : "Collect " + PER_COSTUME + " puzzle pieces in the " + EV.name) + '" data-i="' + esc(c.name) + '" aria-label="Locked: ' + esc(c.name) + '"><span><img src="' + icon(c) + '" alt="" style="width:1.2em;height:1.2em;border-radius:50%;vertical-align:middle"></span><i>🔒</i></button>';
        }).join("") + "</div>";
    }

    var api = {
      EV: EV, TOTAL: TOTAL, KEY: KEY, PER_DAY: PER_DAY, PER_COSTUME: PER_COSTUME,
      state: st, phase: phase, today: today, daysLeft: daysLeft, earn: earn, earnDaily: earnDaily,
      unlockedCount: unlockedCount, haveOf: haveOf, isDone: isDone, target: target, setCur: setCur, puzzleHtml: puzzleHtml, fractionText: fractionText, pickerHtml: pickerHtml,
      icon: icon, pic: pic, css: css, useIcon: useIcon, todayCount: todayCount
    };
    return api;
  }
  var ALL = EVENTS.map(make);
  function forId(id) { return ALL.filter(function (e) { return e.EV.id === id; })[0] || null; }
  // The event earning pieces right now (a preview wins), otherwise null
  function current() {
    var pv = forId(previewId()); if (pv) return pv;
    return ALL.filter(function (e) { return e.phase() === "on"; })[0] || null;
  }
  // For the homepage banner: the event running now, otherwise the next one coming up
  function featured() { return current() || ALL.filter(function (e) { return e.phase() === "soon"; })[0] || null; }

  /* ---------- earning hooks ---------- */
  // Every game that uses game-round-ui.js fires this when a 10-question round is finished.
  window.addEventListener("lwn:round-done", function () { var e = current(); if (e) e.earn(1, "round"); });
  // Daily Challenge: first full finish of the day = 2 pieces.
  function hook() {
    var L = window.LWNLeaderboard;
    if (!L || L.__eventHooked || typeof L.saveScore !== "function") return !!(L && L.__eventHooked);
    var orig = L.saveScore;
    L.saveScore = function (p) {
      try {
        if (p && p.game === "daily_challenge" && !/\|dash\|/.test(String(p.level || ""))) { var e = current(); if (e) e.earnDaily(); }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    L.__eventHooked = true; return true;
  }
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 40) clearInterval(t); }, 250); }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById("lwnEventCss")) return;
    var s = document.createElement("style"); s.id = "lwnEventCss";
    s.textContent =
      ".lwn-cos{display:inline-block;vertical-align:-.22em;line-height:1}.lwn-cos img{width:1.2em;height:1.2em;border-radius:50%;object-fit:cover;display:block;box-shadow:0 0 0 2px #fff,0 1px 4px rgba(0,0,0,.18)}" +
      ".lwn-cos .t{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
      ".lwn-puz{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:4px;aspect-ratio:1;border-radius:18px;overflow:hidden;background:#fff;padding:4px;box-shadow:0 8px 22px rgba(40,76,120,.16)}" +
      ".lwn-puz i{display:block;border-radius:12px;background-size:200% 200%;position:relative}" +
      ".lwn-puz i.off{filter:grayscale(1) blur(1.5px);opacity:.28}" +
      ".lwn-puz b{position:absolute;display:grid;place-items:center;font-size:clamp(14px,3vw,26px);pointer-events:none}" +
      ".lwn-puz i.new{animation:lwnPieceIn .9s cubic-bezier(.2,1.4,.4,1) both}" +
      ".lwn-puz.done{gap:0;padding:0}.lwn-puz.done i{border-radius:0}" +
      "@keyframes lwnPieceIn{0%{transform:scale(.2) rotate(-25deg);opacity:0}100%{transform:none;opacity:1}}" +
      "#lwnPiece{position:fixed;inset:0;z-index:2147483300;background:rgba(20,38,60,.45);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
      "#lwnPiece .card{width:min(380px,100%);background:#fff;border-radius:28px;padding:20px 20px 18px;text-align:center;color:#203D61;box-shadow:0 26px 60px rgba(20,40,70,.35);animation:lwnPieceIn .45s ease both}" +
      "#lwnPiece h2{font:700 25px/1.1 'Fredoka',system-ui,sans-serif;color:#E0602F;margin:0 0 12px}" +
      "#lwnPiece .lwn-puz{width:min(230px,70vw);margin:0 auto}" +
      "#lwnPiece .frac{font:700 22px/1.2 'Fredoka',system-ui,sans-serif;color:#2D6CB9;margin:14px 0 4px}" +
      "#lwnPiece p{margin:4px 0 0;font-weight:800;color:#5E6B85;line-height:1.4}" +
      "#lwnPiece .btns{display:grid;gap:8px;margin-top:16px}" +
      "#lwnPiece button,#lwnPiece a{border:0;border-radius:16px;padding:13px;font:700 18px/1 'Fredoka',system-ui,sans-serif;cursor:pointer;text-decoration:none}" +
      "#lwnPiece .pick{margin-top:14px;background:#FFF6EC;border-radius:18px;padding:10px}#lwnPiece .pick b{display:block;font:700 16px/1.2 'Fredoka',sans-serif;color:#5A2E0C;margin-bottom:8px}" +
      "#lwnPiece .pick div{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}" +
      "#lwnPiece .pick button{border:3px solid #fff;background:#fff;border-radius:16px;padding:4px 4px 6px;width:84px;cursor:pointer;font:800 11px/1.15 'Nunito',sans-serif;color:#5A2E0C;box-shadow:0 3px 8px rgba(120,60,10,.12)}" +
      "#lwnPiece .pick button img{display:block;width:62px;height:62px;border-radius:50%;margin:0 auto 4px;object-fit:cover}" +
      "#lwnPiece .pick button.on{border-color:#FF9A3C;background:#FFF1DC}" +
      "#lwnPiece .main{background:linear-gradient(135deg,#FF9A3C,#E0602F);color:#fff}#lwnPiece .sec{background:#EEF4FB;color:#3B6FAF}" +
      ".lwn-ev-banner{display:flex;gap:14px;align-items:center;margin:14px 0 6px;padding:14px 16px;border-radius:24px;text-decoration:none;color:#5A2E0C;" +
      "background:linear-gradient(135deg,#FFF1DC,#FFE2BC);border:2px solid #FFC98A;box-shadow:0 10px 26px rgba(224,96,47,.16);font-family:'Nunito',system-ui,sans-serif}" +
      ".lwn-ev-banner .faces{display:flex;flex:none}.lwn-ev-banner .faces img{width:46px;height:46px;border-radius:50%;border:3px solid #fff;margin-left:-14px;object-fit:cover;background:#fff}" +
      ".lwn-ev-banner .faces img:first-child{margin-left:0}.lwn-ev-banner .faces img.lock{filter:grayscale(1) brightness(1.15);opacity:.6}" +
      ".lwn-ev-banner b{display:block;font:700 19px/1.15 'Fredoka',system-ui,sans-serif;color:#C2481B}" +
      ".lwn-ev-banner small{display:block;font-weight:800;font-size:13.5px;margin-top:3px;line-height:1.3}" +
      ".lwn-ev-banner .go{margin-left:auto;flex:none;background:#E0602F;color:#fff;border-radius:999px;padding:9px 14px;font:700 15px/1 'Fredoka',sans-serif}" +
      "@media(max-width:520px){.lwn-ev-banner{flex-wrap:wrap}.lwn-ev-banner .go{margin-left:0;width:100%;text-align:center}}" +
      "@media (prefers-reduced-motion:reduce){.lwn-puz i.new,#lwnPiece .card{animation:none}}";
    document.head.appendChild(s);
  }

  /* ---------- popup after earning ---------- */
  var queue = [];
  function popup(E, items) {
    items.forEach(function (it) { queue.push([E, it]); });
    if (!document.getElementById("lwnPiece")) showNext();
  }
  function showNext() {
    var item = queue.shift(); if (!item) return;
    css();
    var E = item[0], it = item[1], EV = E.EV, c = it.c, have = it.have;
    var done = have === PER_COSTUME, all = it.all, cap = E.todayCount() >= PER_DAY && !queue.length;
    var nxt = EV.next ? forId(EV.next) : null, cnt = EV.costumes.length;
    var left = EV.costumes.filter(function (x) { return !E.isDone(x); });
    var title = all ? "🏆 You unlocked " + (cnt === 2 ? "both" : "all " + cnt) + "!" : done ? "🎉 " + c.name + " unlocked!" : "🧩 New puzzle piece!";
    var msg = all ? (EV.certificate ? "You collected every puzzle piece. Get your Grand Prize certificate!"
        : "You finished the " + EV.name + "!" + (nxt ? " The " + nxt.EV.name + " starts " + nxt.EV.dates.split("–")[0].trim() + "." : ""))
      : done ? "You finished the picture. You can use " + c.name + " as your icon!"
      : "Finish " + (PER_COSTUME - have) + " more to unlock " + c.name + ".";
    if (cap && !all) msg += " That’s " + PER_DAY + " pieces today. Come back tomorrow for more!";
    // After finishing a picture, the kid picks which puzzle to work on next
    var pick = done && !all && left.length > 1 && !queue.length ? '<div class="pick"><b>Pick your next puzzle:</b><div>' +
      left.map(function (x) { return '<button type="button" data-pick="' + x.id + '"><img src="' + E.icon(x) + '" alt=""><span>' + esc(x.name) + "</span></button>"; }).join("") + "</div></div>" : "";
    var w = document.createElement("div"); w.id = "lwnPiece";
    w.innerHTML = '<div class="card" role="dialog" aria-modal="true"><h2>' + title + "</h2>" + E.puzzleHtml(c, have, true) +
      '<div class="frac">' + fractionText(have) + (have < 4 ? " of the picture" : " picture") + "</div><p>" + esc(msg) + "</p>" + pick + '<div class="btns">' +
      (all && EV.certificate ? '<a class="main" href="' + EV.page + '#prize">Get my certificate 🏆</a>'
        : done ? '<button type="button" class="main" data-use="' + c.token + '">Use as my icon</button>' : '<button type="button" class="main" data-ok>Yay! 🎉</button>') +
      '<a class="sec" href="' + EV.page + '">See my puzzles</a></div></div>';
    document.body.appendChild(w);
    function close() { w.remove(); setTimeout(showNext, 250); }
    w.addEventListener("click", function (e) { if (e.target === w) close(); });
    var ok = w.querySelector("[data-ok]"); if (ok) ok.onclick = close;
    var use = w.querySelector("[data-use]"); if (use) use.onclick = function () { useIcon(c.token); close(); };
    w.querySelectorAll("[data-pick]").forEach(function (b) {
      b.onclick = function () {
        E.setCur(b.dataset.pick);
        w.querySelectorAll("[data-pick]").forEach(function (x) { x.classList.toggle("on", x === b); });
        var lbl = w.querySelector(".pick b"); if (lbl) lbl.textContent = "Next up: " + b.textContent + " ✓";
      };
    });
    try { if (done && window.LWNFun && LWNFun.confetti) LWNFun.confetti(); } catch (e) {}
  }
  function useIcon(token) {
    var P = window.LWNProfile, p = (P && P.get()) || {};
    if (!p.name || String(p.name).trim().toLowerCase() === "nini") { if (P) P.open({ onSave: function () { location.reload(); } }); return; }
    if (P) P.save(p.name, token);
    setTimeout(function () { location.reload(); }, 200);
  }

  /* ---------- costume icons anywhere on the page ---------- */
  // Avatars are saved as short text (like "🥧✨") so they work on every leaderboard; this swaps that text for the picture.
  var TOKENS = [];
  ALL.forEach(function (E) { E.EV.costumes.forEach(function (c) { TOKENS.push({ t: c.token, c: c, E: E }); }); });
  var RX = new RegExp(TOKENS.map(function (x) { return x.t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|"), "g");
  function byToken(t) { return TOKENS.filter(function (x) { return x.t === t; })[0]; }
  function swapIn(root) {
    if (!root || !document.body) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeValue.indexOf("✨") < 0) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TITLE)$/.test(p.nodeName) || (p.closest && p.closest(".lwn-cos"))) return NodeFilter.FILTER_REJECT;
        RX.lastIndex = 0; return RX.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var list = []; while (walker.nextNode()) list.push(walker.currentNode);
    if (!list.length) return;
    css();
    list.forEach(function (node) {
      var frag = document.createDocumentFragment(), text = node.nodeValue, last = 0, m; RX.lastIndex = 0;
      while ((m = RX.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var x = byToken(m[0]), sp = document.createElement("span"); sp.className = "lwn-cos";
        sp.innerHTML = '<img src="' + x.E.icon(x.c) + '" alt="' + esc(x.c.name) + '"><span class="t">' + m[0] + "</span>";
        frag.appendChild(sp); last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  var pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; swapIn(document.body); }); }
  function watch() {
    swapIn(document.body);
    try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {}
  }

  /* ---------- icon picker sections (profile.js) ---------- */
  function pickerHtml(avatar) { return ALL.map(function (E) { return E.pickerHtml(avatar); }).join(""); }

  /* ---------- homepage banner ---------- */
  function banner() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page !== "index.html" || document.getElementById("lwnEvBanner")) return;
    var E = featured(); if (!E) return;
    var EV = E.EV, ph = E.phase(), s = E.state(), cnt = EV.costumes.length;
    var anchor = document.querySelector("#skill-games .daily-treasure-banner, #skill-games"); if (!anchor) return;
    css();
    var n = E.unlockedCount(s), dl = E.daysLeft();
    var a = document.createElement("a"); a.id = "lwnEvBanner"; a.className = "lwn-ev-banner"; a.href = EV.page;
    var sub = ph === "soon" ? "Starts " + EV.dates.split("–")[0].trim() + "! Collect puzzle pieces and unlock " + cnt + " Nini costumes."
      : s.n >= E.TOTAL ? "You unlocked " + (cnt === 2 ? "both" : "all " + cnt) + "! 🏆" + (EV.certificate ? " Get your certificate." : "")
      : s.n + " of " + E.TOTAL + " pieces · " + n + " of " + cnt + " costumes · " + dl + " day" + (dl === 1 ? "" : "s") + " left";
    a.innerHTML = '<span class="faces">' + EV.costumes.map(function (c, i) { return '<img src="' + E.icon(c) + '" alt="" class="' + (E.isDone(c, s) ? "" : "lock") + '">'; }).join("") + "</span>" +
      "<span><b>🧩 " + esc(EV.name) + "</b><small>" + esc(sub) + '</small></span><span class="go">' + (ph === "soon" ? "Peek →" : "Play →") + "</span>";
    if (anchor.id === "skill-games") { var h = anchor.querySelector("h2"); if (h && h.nextSibling) anchor.insertBefore(a, h.nextSibling); else anchor.prepend(a); }
    else anchor.parentNode.insertBefore(a, anchor);
  }

  /* ---------- homepage announcement (once per event per device) ---------- */
  function busy() { return !!document.querySelector(".lwn-modal:not(#lwnEvAnnounce),#lwnWelcome,#lwnProfile,#lwnNicknameOverlay,#lwnRetainAsk,#lwnPiece,#lwnWelcomeBack"); }
  function announce(tries) {
    tries = tries || 0;
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page !== "index.html") return;
    var E = current(); if (!E || E.phase() !== "on") return;
    var EV = E.EV, KEYA = "lwn-event-announced-" + EV.id;
    try { if (localStorage.getItem(KEYA)) return; } catch (e) { return; }
    if (E.state().n > 0) { try { localStorage.setItem(KEYA, "1"); } catch (e) {} return; }
    if (busy() || document.getElementById("lwnEvAnnounce")) { if (tries < 30) setTimeout(function () { announce(tries + 1); }, 1500); return; }
    css();
    if (!document.getElementById("lwnEvAnnCss")) {
      var st2 = document.createElement("style"); st2.id = "lwnEvAnnCss";
      st2.textContent =
        "#lwnEvAnnounce{position:fixed;inset:0;z-index:2147483200;background:rgba(20,38,60,.5);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
        "#lwnEvAnnounce .card{width:min(400px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:30px;overflow:hidden;text-align:center;color:#203D61;box-shadow:0 28px 70px rgba(20,40,70,.4);animation:lwnPieceIn .5s ease both}" +
        "#lwnEvAnnounce .art{position:relative;display:flex;justify-content:center;gap:0;background:linear-gradient(135deg,#3B1E5C,#6B3FA0);padding:30px 10px 22px}" +
        "#lwnEvAnnounce .art img{width:42%;max-width:150px;aspect-ratio:1;object-fit:cover;border-radius:22px;border:4px solid #fff;box-shadow:0 10px 24px rgba(0,0,0,.3)}" +
        "#lwnEvAnnounce .art img:first-child{transform:rotate(-6deg);margin-right:-10px}#lwnEvAnnounce .art img:nth-child(2){transform:rotate(6deg) translateY(8px)}" +
        "#lwnEvAnnounce .new{position:absolute;top:12px;left:14px;background:#FF7A2F;color:#fff;font:700 13px/1 'Fredoka',sans-serif;padding:6px 10px;border-radius:999px;letter-spacing:.04em}" +
        "#lwnEvAnnounce .x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.9);font-size:22px;color:#4B2A73;cursor:pointer}" +
        "#lwnEvAnnounce .body{padding:18px 20px 20px}" +
        "#lwnEvAnnounce h2{font:700 25px/1.12 'Fredoka',system-ui,sans-serif;color:#C2481B;margin:0}" +
        "#lwnEvAnnounce .sub{font-weight:800;color:#5E6B85;margin:6px 0 14px}" +
        "#lwnEvAnnounce ol{list-style:none;margin:0;padding:0;display:grid;gap:8px;text-align:left}" +
        "#lwnEvAnnounce li{display:flex;align-items:center;gap:12px;background:#FFF6EC;border-radius:16px;padding:9px 12px;font-weight:800;color:#5A2E0C}" +
        "#lwnEvAnnounce li .ic{font-size:26px;flex:none;width:34px;text-align:center}#lwnEvAnnounce li .tx{flex:1;min-width:0}#lwnEvAnnounce li b{display:block;font:700 16px/1.1 'Fredoka',sans-serif}" +
        "#lwnEvAnnounce li small{display:block;font-size:13px;color:#8B6A4E;font-weight:800}" +
        "#lwnEvAnnounce .go{display:block;width:100%;margin-top:16px;border:0;border-radius:18px;padding:15px;background:linear-gradient(135deg,#FF9A3C,#E0602F);color:#fff;font:700 20px/1 'Fredoka',sans-serif;cursor:pointer;box-shadow:0 5px 0 #A9401A}" +
        "#lwnEvAnnounce .see{display:block;margin-top:12px;font-weight:900;color:#3B6FAF;text-decoration:none}";
      document.head.appendChild(st2);
    }
    var cnt = EV.costumes.length, dl = E.daysLeft();
    var w = document.createElement("div"); w.id = "lwnEvAnnounce"; w.className = "lwn-modal";
    w.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="lwnEvAnnT"><div class="art"><span class="new">NEW!</span>' +
      '<button type="button" class="x" aria-label="Close">×</button>' +
      EV.costumes.slice(0, 4).map(function (c) { return '<img src="' + E.pic(c) + '" alt="' + esc(c.name) + '"' + (EV.costumes.length > 2 ? ' style="width:23%;border-width:3px;border-radius:16px"' : "") + ">"; }).join("") + "</div>" +
      '<div class="body"><h2 id="lwnEvAnnT">' + EV.emoji + " " + esc(EV.name) + "!</h2>" +
      '<div class="sub">Unlock ' + cnt + " new costumes" + " for your icon · " + dl + " day" + (dl === 1 ? "" : "s") + " only!</div>" +
      "<ol><li><span class=\"ic\">🎮</span><span class=\"tx\"><b>Do a math round</b><small>Any game or the Daily Challenge</small></span></li>" +
      "<li><span class=\"ic\">🧩</span><span class=\"tx\"><b>Collect puzzle pieces</b><small>Up to " + PER_DAY + " pieces a day</small></span></li>" +
      "<li><span class=\"ic\">" + EV.emoji + "</span><span class=\"tx\"><b>Unlock the costumes</b><small>4 pieces finish each picture</small></span></li></ol>" +
      '<button type="button" class="go">Start collecting!</button><a class="see" href="' + EV.page + '">See the costumes →</a></div></div>';
    document.body.appendChild(w);
    try { localStorage.setItem(KEYA, "1"); } catch (e) {}
    function close() { w.remove(); }
    w.querySelector(".x").onclick = close;
    w.addEventListener("click", function (e) { if (e.target === w) close(); });
    w.querySelector(".go").onclick = function () {
      close();
      var g = document.getElementById("skill-games"); if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    try { if (window.LWNStats && LWNStats.track) LWNStats.track("event_announce", { event: EV.id }); } catch (e) {}
  }

  window.LWNEvent = {
    all: ALL, forId: forId, current: current, featured: featured, today: today, fractionText: fractionText,
    pickerHtml: pickerHtml, css: css, useIcon: useIcon, swap: swapIn
  };
  function init() { watch(); banner(); setTimeout(announce, 2500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
