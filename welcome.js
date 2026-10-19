/* Learn With Nini – first-visit welcome.
   Shown once to new players: pick a nickname, an icon and a grade. Every page and the leaderboard use this setup. */
(function () {
  var PROFILE = "learningWithNiniProfileV1", DONE = "lwn-welcomed-v1";
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (["privacy.html", "parents-teachers.html"].indexOf(page) >= 0) return;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function profile() { try { return JSON.parse(get(PROFILE) || "null"); } catch (e) { return null; } }
  function hasNickname() { var p = profile(); return !!(p && String(p.name || "").trim() && String(p.name).trim().toLowerCase() !== "nini"); }

  if (get(DONE) || hasNickname()) return;

  var AVATARS = ["⭐", "🐱", "🐰", "🌈", "❤️", "🦄", "🐶", "🦊", "🐼", "🚀"];
  function css() {
    var s = document.createElement("style"); s.id = "lwn-welcome-css";
    s.textContent =
      "#lwnWelcome{position:fixed;inset:0;z-index:2147483600;background:rgba(27,51,80,.45);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
      "#lwnWelcome .card{width:min(470px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:28px;padding:22px 20px;box-shadow:0 28px 70px rgba(29,59,96,.3);color:#203D61;text-align:center;animation:lwnIn .35s ease-out}" +
      "#lwnWelcome img{display:block;width:92px;height:92px;border-radius:50%;border:4px solid #F5633E;margin:-4px auto 0}" +
      "#lwnWelcome h2{font:700 28px/1.1 'Fredoka',system-ui,sans-serif;color:#3574c1;margin:8px 0 4px}" +
      "#lwnWelcome p{margin:0 0 14px;color:#6e6688;font-weight:800;line-height:1.4}" +
      "#lwnWelcome .lbl{text-align:left;font-weight:900;color:#345175;margin:12px 0 6px;font-size:15px}" +
      "#lwnWelcome input{width:100%;border:2px solid #d4e2f3;border-radius:15px;padding:13px 14px;font:inherit;font-weight:800;font-size:17px;outline:none}" +
      "#lwnWelcome input:focus{border-color:#488bdd;box-shadow:0 0 0 4px rgba(72,139,221,.1)}" +
      "#lwnWelcome .help{text-align:left;font-size:12px;font-weight:800;color:#7a7191;margin-top:6px}#lwnWelcome .help.bad{color:#b2533b}" +
      "#lwnWelcome .av{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}" +
      "#lwnWelcome .av button,#lwnWelcome .gr button{border:2px solid #e1eaf6;border-radius:14px;background:#faf9ff;cursor:pointer;color:#284C79}" +
      "#lwnWelcome .av button{min-height:50px;font-size:24px}" +
      "#lwnWelcome .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}" +
      "#lwnWelcome .gr button{padding:10px 2px;font:700 16px/1 'Fredoka',sans-serif}" +
      "#lwnWelcome .on{border-color:#4088df!important;background:#e8f2ff!important}" +
      "#lwnWelcome .go{width:100%;margin-top:18px;border:0;border-radius:16px;padding:15px;background:linear-gradient(135deg,#45b8ed,#478add);color:#fff;font:700 20px/1 'Fredoka',sans-serif;cursor:pointer}" +
      "#lwnWelcome .later{width:100%;margin-top:6px;border:0;background:none;color:#72688c;font-weight:900;padding:10px;cursor:pointer}" +
      "@keyframes lwnIn{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}";
    document.head.appendChild(s);
  }

  function show() {
    if (document.getElementById("lwnWelcome") || document.getElementById("lwnNicknameOverlay")) return;
    css();
    var grade = "3";
    try { var st = JSON.parse(get("dm-settings") || "{}"); if (["2", "3", "4", "5"].indexOf(String(st.grade)) >= 0) grade = String(st.grade); } catch (e) {}
    var avatar = "⭐";
    var w = document.createElement("div"); w.id = "lwnWelcome";
    w.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="lwnWTitle">' +
      '<img src="/nini-face.webp" alt="Nini">' +
      '<h2 id="lwnWTitle">Hi! I’m Nini 👋</h2>' +
      "<p>Let’s get you set up so I can cheer for you, track your streak, and put you on the leaderboard!</p>" +
      '<div class="lbl">1. Pick a fun nickname</div>' +
      '<input id="lwnWName" maxlength="24" autocomplete="off" placeholder="Example: Math Dragon">' +
      '<div class="help" id="lwnWHelp">Use a fun nickname — not your real name, email, or phone number.</div>' +
      '<div class="lbl">2. Choose your icon</div><div class="av">' +
      AVATARS.map(function (a) { return '<button type="button" data-av="' + a + '" class="' + (a === avatar ? "on" : "") + '">' + a + "</button>"; }).join("") + "</div>" +
      '<div class="lbl">3. What grade are you in?</div><div class="gr">' +
      ["2", "3", "4", "5"].map(function (g) { return '<button type="button" data-g="' + g + '" class="' + (g === grade ? "on" : "") + '">Grade ' + g + "</button>"; }).join("") + "</div>" +
      '<button type="button" class="go">Let’s go! 🚀</button>' +
      '<button type="button" class="later">Maybe later</button>' +
      '<a href="/account.html" style="display:block;margin-top:4px;font-weight:900;font-size:13px;color:#3574c1">👤 Grown-ups: save progress with a free account →</a></div>';
    document.body.appendChild(w);

    w.querySelectorAll("[data-av]").forEach(function (b) {
      b.onclick = function () { avatar = b.dataset.av; w.querySelectorAll("[data-av]").forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
    w.querySelectorAll("[data-g]").forEach(function (b) {
      b.onclick = function () { grade = b.dataset.g; w.querySelectorAll("[data-g]").forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
    var input = w.querySelector("#lwnWName"), help = w.querySelector("#lwnWHelp");
    w.querySelector(".go").onclick = function () {
      var name = String(input.value || "").trim().replace(/\s+/g, " ").slice(0, 24);
      if (!name) { help.textContent = "Type a nickname first 🙂"; help.classList.add("bad"); input.focus(); return; }
      if (/@|\.(com|org|net|edu|gov)\b/i.test(name) || (name.match(/\d/g) || []).length >= 7) {
        help.textContent = "Please use a fun nickname only — no email address or phone number."; help.classList.add("bad"); input.focus(); return;
      }
      if (name.toLowerCase() === "nini") { help.textContent = "That one’s taken by me! 😄 Try another."; help.classList.add("bad"); input.focus(); return; }
      var prof = { name: name, avatar: avatar };
      set(PROFILE, JSON.stringify(prof)); set("niniPlayerName", name); set("niniAvatar", avatar);
      try { var s2 = JSON.parse(get("dm-settings") || "{}"); s2.grade = grade; s2.name = name; set("dm-settings", JSON.stringify(s2)); } catch (e) {}
      set(DONE, "1");
      w.remove();
      // Refresh so every part of the page (leaderboard name, Daily Challenge) picks up the new setup.
      location.reload();
    };
    w.querySelector(".later").onclick = function () { set(DONE, "1"); w.remove(); };
  }

  function start() { setTimeout(show, 600); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
