/* Learn With Nini – game feel: Nini mascot, sounds, confetti, combos, streak freeze.
   Everything is saved on this device only. */
window.LWNFun = (function () {
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------------- sounds (made in code, no files) ---------------- */
  var muted = load("lwn-sound-muted", false), ctx = null;
  function ac() {
    if (muted) return null;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) { return null; }
    return ctx;
  }
  function tone(freq, start, len, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + len + 0.02);
  }
  var sfx = {
    right: function () { tone(880, 0, 0.12, "triangle"); tone(1320, 0.09, 0.2, "triangle"); },
    wrong: function () { tone(220, 0, 0.18, "sine", 0.12); tone(185, 0.12, 0.22, "sine", 0.1); },
    combo: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, i * 0.07, 0.18, "triangle", 0.16); }); },
    win:   function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.26, "triangle", 0.17); }); },
    badge: function () { [1047, 1319, 1568, 2093].forEach(function (f, i) { tone(f, i * 0.08, 0.3, "sine", 0.14); }); }
  };
  function play(name) { try { sfx[name] && sfx[name](); } catch (e) {} }

  /* ---------------- styles ---------------- */
  function css() {
    if (document.getElementById("lwn-fun-css")) return;
    var s = document.createElement("style"); s.id = "lwn-fun-css";
    s.textContent =
      "#lwnMascot{position:fixed;right:12px;top:78px;z-index:60;display:flex;align-items:center;gap:8px;pointer-events:none;" +
      "flex-direction:row-reverse;opacity:0;transform:translateY(-10px) scale(.9);transition:opacity .2s,transform .25s}" +
      "#lwnMascot.on{opacity:1;transform:none}" +
      "#lwnMascot img{width:64px;height:64px;border-radius:50%;border:3px solid #F5633E;background:#fff;box-shadow:0 6px 16px rgba(40,76,120,.25)}" +
      "#lwnMascot.bounce img{animation:lwnBounce .6s ease-out}" +
      "#lwnMascot .say{background:#fff;color:#1d3c63;font:800 16px/1.25 'Fredoka','Nunito',system-ui,sans-serif;padding:10px 14px;border-radius:16px;" +
      "box-shadow:0 6px 16px rgba(40,76,120,.18);max-width:220px;position:relative}" +
      "#lwnMascot .say:after{content:'';position:absolute;right:-7px;top:50%;margin-top:-7px;border:7px solid transparent;border-left-color:#fff;border-right:0}" +
      "#lwnCombo{position:fixed;left:50%;top:38%;z-index:61;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;" +
      "font:700 clamp(30px,7vw,54px)/1 'Fredoka',system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#44B8EE,#468ADE);" +
      "padding:16px 26px;border-radius:24px;box-shadow:0 10px 30px rgba(70,138,222,.35);transition:opacity .2s,transform .3s;white-space:nowrap}" +
      "#lwnCombo.on{opacity:1;transform:translate(-50%,-50%) scale(1)}" +
      "#lwnConfetti{position:fixed;inset:0;z-index:59;pointer-events:none}" +
      "#lwnSound{position:fixed;left:12px;bottom:12px;z-index:58;border:0;border-radius:999px;background:#fff;box-shadow:0 4px 12px rgba(40,76,120,.2);" +
      "width:44px;height:44px;font-size:20px;cursor:pointer}" +
      "#lwnSound.lwn-in-bar{position:static;box-shadow:none;background:none;width:auto;height:auto;font-size:22px}" +
      ".lwn-freeze{margin-top:10px;background:#E8F6FF;border:1px solid #BFE6FF;border-radius:14px;padding:8px 10px;font-size:13px;font-weight:800;color:#1b5e8c}" +
      ".lwn-freeze.saved{background:#FFF7D7;border-color:#F7C948;color:#7a5a00}" +
      "@keyframes lwnBounce{0%{transform:scale(.7)}50%{transform:scale(1.12)}100%{transform:scale(1)}}" +
      "@media (prefers-reduced-motion:reduce){#lwnMascot,#lwnCombo{transition:none}#lwnMascot.bounce img{animation:none}}";
    document.head.appendChild(s);
  }

  /* ---------------- Nini mascot ---------------- */
  var LINES = {
    combo3: ["3 in a row! 🔥", "You're on fire!", "Look at you go!"],
    combo5: ["5 in a row!! 🤩", "Wow, 5 straight!", "Math superstar!"],
    combo10:["10 in a row?! 😱", "You're unstoppable!", "Even I'm impressed!"],
    retry:  ["You got it! 💪", "Nice fix!", "That's how we learn!"],
    miss:   ["It's okay, keep going!", "Mistakes help us learn 💛", "Next one's yours!", "Shake it off! You got this"],
    start:  ["Let's do this! ✏️", "Ready? I believe in you!", "Brain power on! 🧠"],
    great:  ["AMAZING job today! 🎉", "You crushed it!", "Best mathematician ever!"],
    good:   ["Great work today! ⭐", "So proud of you!", "Keep it up!"],
    ok:     ["Nice effort! Practice makes progress 💛", "Every day you get stronger!", "Thanks for practicing with me!"]
  };
  var hideT = null;
  function say(key, ms) {
    css();
    var m = document.getElementById("lwnMascot");
    if (!m) {
      m = document.createElement("div"); m.id = "lwnMascot"; m.setAttribute("aria-live", "polite");
      m.innerHTML = '<img src="/nini-face.webp" alt="Nini"><div class="say"></div>';
      document.body.appendChild(m);
    }
    m.querySelector(".say").textContent = LINES[key] ? pick(LINES[key]) : key;
    m.classList.remove("bounce"); void m.offsetWidth; m.classList.add("on", "bounce");
    clearTimeout(hideT); hideT = setTimeout(function () { m.classList.remove("on"); }, ms || 1800);
  }

  /* ---------------- combo banner + confetti ---------------- */
  function comboBanner(n) {
    css();
    var b = document.getElementById("lwnCombo");
    if (!b) { b = document.createElement("div"); b.id = "lwnCombo"; document.body.appendChild(b); }
    b.textContent = "🔥 " + n + " in a row!";
    b.classList.add("on"); setTimeout(function () { b.classList.remove("on"); }, 1100);
  }
  function confetti(amount) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    css();
    var c = document.createElement("canvas"); c.id = "lwnConfetti"; document.body.appendChild(c);
    var dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px";
    var g = c.getContext("2d"); g.scale(dpr, dpr);
    var colors = ["#F5633E", "#468ADE", "#F7C948", "#2F9DF5", "#1E9E58", "#FF8A3D"], P = [];
    for (var i = 0; i < (amount || 140); i++) P.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 12,
      vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: pick(colors) });
    var t0 = performance.now();
    (function frame(t) {
      g.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.va;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  /* ---------------- answer events ---------------- */
  var combo = 0;
  function start() { combo = 0; soundButton(); setTimeout(function () { say("start", 1600); }, 300); }
  function right(info) {
    combo++;
    play("right");
    if (combo === 3 || combo === 5 || combo === 10 || (combo > 10 && combo % 5 === 0)) {
      play("combo"); comboBanner(combo); confetti(60);
      say(combo >= 10 ? "combo10" : combo >= 5 ? "combo5" : "combo3");
    } else if (info && info.retry) {
      say("retry", 1400);
    }
  }
  function wrong(final) { play("wrong"); if (final) { combo = 0; say("miss"); } }
  function skipped() { combo = 0; }
  function finish(pct) {
    combo = 0;
    var m = document.getElementById("lwnMascot"); if (m) m.style.top = "16px";
    play("win"); confetti(180);
    setTimeout(function () { say(pct >= 90 ? "great" : pct >= 60 ? "good" : "ok", 3200); }, 250);
    setTimeout(function () { var m2 = document.getElementById("lwnMascot"); if (m2) m2.style.top = ""; }, 3800);
  }

  function soundButton() {
    css();
    var b = document.getElementById("lwnSound");
    if (!b) {
      b = document.createElement("button"); b.id = "lwnSound"; b.type = "button";
      b.addEventListener("click", function () { muted = !muted; save("lwn-sound-muted", muted); paint(); if (!muted) play("right"); });
      var pause = document.getElementById("pauseBtn");
      if (pause && pause.parentNode) { b.className = "icon lwn-in-bar"; pause.parentNode.insertBefore(b, pause); }
      else document.body.appendChild(b);
    }
    function paint() { b.textContent = muted ? "🔇" : "🔊"; b.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off"); }
    paint();
  }

  /* ---------------- streak freeze ----------------
     Earn 1 freeze each time the streak reaches a multiple of 7 (hold up to 2).
     If a day is missed, a freeze covers it automatically so the streak survives. */
  var FKEY = "lwn-freeze-v1";
  function fstate() { var s = load(FKEY, null); if (!s || typeof s !== "object") s = { have: 0, used: [], earned: [] };
    s.used = s.used || []; s.earned = s.earned || []; return s; }
  function frozenDates() { return new Set(fstate().used); }
  function shift(dateStr, days) { var d = new Date(dateStr + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }

  // Called with the set of days actually completed and today's Hawaii date. Returns a note if a freeze was just used.
  function applyFreezes(done, today) {
    var s = fstate(); if (!s.have) return "";
    var has = function (d) { return done.has(d) || s.used.indexOf(d) >= 0; };
    var y = shift(today, -1); if (has(y)) return "";
    var gap = []; var d = y;
    while (!has(d) && gap.length < s.have) { gap.push(d); d = shift(d, -1); }
    if (!has(d)) return "";  // gap too long for the freezes we have — streak is lost
    var note = "🧊 Streak freeze used! Your streak survived " + gap.length + " missed day" + (gap.length > 1 ? "s" : "") + ".";
    s.used = s.used.concat(gap); s.have -= gap.length; s.notice = { date: today, text: note }; save(FKEY, s);
    return note;
  }
  function maybeEarn(current, today) {
    if (!current || current % 7 !== 0) return false;
    var s = fstate(); if (s.earned.indexOf(today) >= 0 || s.have >= 2) return false;
    s.have += 1; s.earned.push(today); save(FKEY, s); return true;
  }
  function freezeNote(panel, savedNote, today) {
    if (!panel) return; css();
    var st = fstate();
    if (!savedNote && st.notice && st.notice.date === today) savedNote = st.notice.text;
    var n = panel.querySelector(".lwn-freeze");
    if (!n) { n = document.createElement("div"); n.className = "lwn-freeze"; panel.appendChild(n); }
    var have = fstate().have;
    n.className = "lwn-freeze" + (savedNote ? " saved" : "");
    n.textContent = savedNote ? savedNote :
      have ? "🧊 " + have + " streak freeze" + (have > 1 ? "s" : "") + " ready — a missed day won't break your streak."
           : "🧊 Reach a 7-day streak to earn a streak freeze.";
  }

  return { start: start, right: right, wrong: wrong, skipped: skipped, finish: finish, say: say, confetti: confetti, play: play,
           frozenDates: frozenDates, applyFreezes: applyFreezes, maybeEarn: maybeEarn, freezeNote: freezeNote };
})();
