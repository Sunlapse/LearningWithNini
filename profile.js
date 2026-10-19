/* Learn With Nini – the player's nickname + icon.
   One picker used everywhere ("Change my icon"). Each save is time-stamped so a parent account
   carries the newest nickname/icon to every signed-in device. */
(function () {
  if (window.LWNProfile) return;
  var KEY = "learningWithNiniProfileV1";
  var ICONS = ["⭐", "🐱", "🦭", "🐰", "🦄", "🐶", "🦊", "🐼", "🐨", "🐯",
               "🐸", "🐢", "🐬", "🦋", "🌺", "🌈", "❤️", "🚀", "🏄‍♀️", "⛷️"];

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function hasName(p) { return !!(p && String(p.name || "").trim() && String(p.name).trim().toLowerCase() !== "nini"); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function save(name, avatar) {
    var p = get() || {};
    p.name = name; p.avatar = avatar; p.updatedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
      localStorage.setItem("niniPlayerName", name);
      localStorage.setItem("niniAvatar", avatar);
      var s = JSON.parse(localStorage.getItem("dm-settings") || "{}"); s.name = name; localStorage.setItem("dm-settings", JSON.stringify(s));
    } catch (e) {}
    try { if (window.LWNAccount) LWNAccount.push(true).catch(function () {}); } catch (e) {}
    return p;
  }

  function css() {
    if (document.getElementById("lwnProfileCss")) return;
    var s = document.createElement("style"); s.id = "lwnProfileCss";
    s.textContent =
      "#lwnProfile{position:fixed;inset:0;z-index:2147483600;background:rgba(27,51,80,.45);display:grid;place-items:center;padding:16px;font-family:'Nunito',system-ui,sans-serif}" +
      "#lwnProfile .card{width:min(470px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:28px;padding:22px 20px;box-shadow:0 28px 70px rgba(29,59,96,.3);color:#203D61;text-align:center;position:relative}" +
      "#lwnProfile .x{position:absolute;right:14px;top:12px;border:0;background:#ecf5ff;width:38px;height:38px;border-radius:50%;font-size:24px;color:#4279bd;cursor:pointer}" +
      "#lwnProfile .big{font-size:56px;line-height:1;margin:4px 0}" +
      "#lwnProfile h2{font:700 26px/1.1 'Fredoka',system-ui,sans-serif;color:#3574c1;margin:6px 0 12px}" +
      "#lwnProfile .lbl{text-align:left;font-weight:900;color:#345175;margin:12px 0 6px;font-size:15px}" +
      "#lwnProfile input{width:100%;border:2px solid #d4e2f3;border-radius:15px;padding:12px 14px;font:inherit;font-weight:800;font-size:17px;outline:none}" +
      "#lwnProfile input:focus{border-color:#488bdd;box-shadow:0 0 0 4px rgba(72,139,221,.1)}" +
      "#lwnProfile .help{text-align:left;font-size:12px;font-weight:800;color:#7a7191;margin-top:6px}#lwnProfile .help.bad{color:#b2533b}" +
      "#lwnProfile .av{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}" +
      "#lwnProfile .av button{min-height:50px;font-size:26px;border:2px solid #e1eaf6;border-radius:14px;background:#faf9ff;cursor:pointer}" +
      "#lwnProfile .av button.on{border-color:#4088df;background:#e8f2ff;transform:scale(1.06)}" +
      "#lwnProfile .go{width:100%;margin-top:16px;border:0;border-radius:16px;padding:14px;background:linear-gradient(135deg,#45b8ed,#478add);color:#fff;font:700 19px/1 'Fredoka',sans-serif;cursor:pointer}" +
      ".lwn-me{display:inline-flex;align-items:center;gap:8px;margin-top:12px;align-self:flex-start;border:2px solid #E3EEFA;background:#fff;border-radius:999px;padding:6px 14px 6px 6px;font:800 15px/1 'Nunito',system-ui,sans-serif;color:#24446c;cursor:pointer;box-shadow:0 6px 16px rgba(40,76,120,.07)}" +
      ".lwn-me .i{width:34px;height:34px;border-radius:50%;background:#FFF3C4;display:grid;place-items:center;font-size:20px}" +
      ".lwn-me small{color:#1E6FD9;font-weight:900;font-size:13px}";
    document.head.appendChild(s);
  }

  // opts.onSave(profile) — default: reload so every part of the page shows the new icon
  function open(opts) {
    opts = opts || {};
    if (document.getElementById("lwnProfile")) return;
    css();
    var p = get() || {}, avatar = p.avatar || "⭐";
    var w = document.createElement("div"); w.id = "lwnProfile";
    w.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="lwnPTitle">' +
      '<button type="button" class="x" aria-label="Close">×</button>' +
      '<div class="big" id="lwnPBig">' + esc(avatar) + '</div>' +
      '<h2 id="lwnPTitle">My nickname &amp; icon</h2>' +
      '<div class="lbl">Nickname</div>' +
      '<input id="lwnPName" maxlength="24" autocomplete="off" placeholder="Example: Math Dragon" value="' + esc(hasName(p) ? p.name : "") + '">' +
      '<div class="help" id="lwnPHelp">Keep the same nickname so your scores stay together.</div>' +
      '<div class="lbl">Pick your icon</div><div class="av">' +
      ICONS.map(function (a) { return '<button type="button" data-av="' + a + '" class="' + (a === avatar ? "on" : "") + '" aria-label="Icon ' + a + '">' + a + "</button>"; }).join("") +
      '</div><button type="button" class="go">Save ✓</button></div>';
    document.body.appendChild(w);
    var big = w.querySelector("#lwnPBig"), input = w.querySelector("#lwnPName"), help = w.querySelector("#lwnPHelp");
    w.querySelectorAll("[data-av]").forEach(function (b) {
      b.onclick = function () { avatar = b.dataset.av; big.textContent = avatar; w.querySelectorAll("[data-av]").forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
    function close() { w.remove(); }
    w.querySelector(".x").onclick = close;
    w.addEventListener("click", function (e) { if (e.target === w) close(); });
    w.querySelector(".go").onclick = function () {
      var name = String(input.value || "").trim().replace(/\s+/g, " ").slice(0, 24);
      if (!name) { help.textContent = "Type a nickname first 🙂"; help.classList.add("bad"); input.focus(); return; }
      if (/@|\.(com|org|net|edu|gov)\b/i.test(name) || (name.match(/\d/g) || []).length >= 7) {
        help.textContent = "Please use a fun nickname only — no email address or phone number."; help.classList.add("bad"); input.focus(); return;
      }
      if (name.toLowerCase() === "nini") { help.textContent = "That one’s taken by Nini! 😄 Try another."; help.classList.add("bad"); input.focus(); return; }
      var saved = save(name, avatar);
      try { localStorage.setItem("lwn-welcomed-v1", "1"); } catch (e) {}
      close();
      if (opts.onSave) opts.onSave(saved); else setTimeout(function () { location.reload(); }, 300);
    };
  }

  // Homepage: a "me" chip under the main button — tap to change nickname/icon
  function homeChip() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page !== "index.html") return;
    var anchor = document.querySelector(".hero-copy .quick-links");
    if (!anchor || document.getElementById("lwnMe")) return;
    css();
    var p = get();
    var b = document.createElement("button"); b.type = "button"; b.id = "lwnMe"; b.className = "lwn-me";
    b.innerHTML = hasName(p)
      ? '<span class="i">' + esc(p.avatar || "⭐") + "</span>" + esc(p.name) + " <small>Change my icon ✏️</small>"
      : '<span class="i">🙂</span>Pick your nickname <small>&amp; icon ✏️</small>';
    b.onclick = function () { open(); };
    anchor.parentNode.insertBefore(b, anchor);
  }

  window.LWNProfile = { ICONS: ICONS, get: get, save: save, open: open };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", homeChip); else homeChip();
})();
