/* Learn With Nini – game page comfort fixes (shared by every game).
   1. On phones, the "Choose a Level" cards collapse into one dropdown so the problem is close to the top.
   2. After a CORRECT answer, the game moves to the next question by itself (wrong answers still wait,
      so kids can read the explanation). */
(function () {
  if (window.LWNGameUX) return;
  window.LWNGameUX = true;

  function css() {
    var s = document.createElement("style");
    s.textContent =
      ".lwn-level-toggle{display:none}" +
      "@media(max-width:700px){" +
      ".lwn-level-toggle{display:flex;width:100%;align-items:center;gap:10px;border:2px solid #4088df;border-radius:16px;background:#fff;padding:12px 14px;font:800 16px/1.2 'Nunito',system-ui,sans-serif;color:#1d3c63;cursor:pointer;text-align:left}" +
      ".lwn-level-toggle .n{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#4088df;color:#fff;font-weight:900;font-size:14px}" +
      ".lwn-level-toggle .t{flex:1}.lwn-level-toggle .t small{display:block;color:#7a7191;font-size:12px;font-weight:800}" +
      ".lwn-level-toggle .c{flex:none;font-size:18px;transition:transform .2s}" +
      ".lwn-levels-open .lwn-level-toggle .c{transform:rotate(180deg)}" +
      ".lwn-collapsible .level-grid{display:none!important}" +
      ".lwn-collapsible.lwn-levels-open .level-grid{display:grid!important;margin-top:10px}" +
      ".lwn-collapsible .level-card{min-height:0!important;padding:10px 12px!important}" +
      ".lwn-collapsible h2{display:none!important}section.lwn-collapsible,.lwn-collapsible{margin-top:46px!important;padding:12px!important}" +
      ".nini,.nini img{height:150px!important;min-height:150px!important}" +
      "}" +
      ".lwn-auto-next{position:relative;overflow:hidden}" +
      ".lwn-auto-next:after{content:'';position:absolute;left:0;bottom:0;height:4px;background:rgba(255,255,255,.85);animation:lwnNextBar 1.4s linear forwards}" +
      "@keyframes lwnNextBar{from{width:0}to{width:100%}}";
    document.head.appendChild(s);
  }

  /* ---------- 1. level dropdown on phones ---------- */
  function levelDropdown() {
    var grid = document.querySelector(".level-grid");
    if (!grid) return;
    var cards = grid.querySelectorAll(".level-card");
    if (cards.length < 2) return;
    var section = grid.parentElement;
    section.classList.add("lwn-collapsible");
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "lwn-level-toggle"; btn.setAttribute("aria-expanded", "false");
    grid.parentNode.insertBefore(btn, grid);
    function label() {
      var active = grid.querySelector(".level-card.active") || cards[0];
      var idx = Array.prototype.indexOf.call(cards, active) + 1;
      var name = active.querySelector("h3") ? active.querySelector("h3").textContent.trim() : ("Level " + idx);
      btn.innerHTML = '<span class="n">' + idx + '</span><span class="t">' + name.replace(/</g, "&lt;") +
        "<small>Tap to change level (" + cards.length + " levels)</small></span><span class=\"c\">▾</span>";
    }
    label();
    btn.addEventListener("click", function () {
      var open = section.classList.toggle("lwn-levels-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    cards.forEach(function (c) {
      c.addEventListener("click", function () {
        setTimeout(function () {
          label();
          if (section.classList.contains("lwn-levels-open")) {
            section.classList.remove("lwn-levels-open"); btn.setAttribute("aria-expanded", "false");
            if (window.matchMedia("(max-width:700px)").matches) btn.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 0);
      });
    });
    new MutationObserver(label).observe(grid, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- 2. auto-advance after a correct answer ---------- */
  var timer = null, armedBtn = null;
  function isNextBtn(b) { return b && /^\s*Next Question/i.test(b.textContent || ""); }
  function correctShowing() {
    var good = document.querySelector(".status.good, .feedback.good, .fb.good");
    return !!(good && good.offsetParent !== null);
  }
  function check() {
    var btns = document.querySelectorAll("button");
    var next = null;
    for (var i = 0; i < btns.length; i++) if (isNextBtn(btns[i]) && btns[i].offsetParent !== null && !btns[i].disabled) { next = btns[i]; break; }
    if (next && correctShowing()) {
      if (armedBtn === next && timer) return;
      clearTimeout(timer); armedBtn = next; next.classList.add("lwn-auto-next");
      timer = setTimeout(function () {
        timer = null; next.classList.remove("lwn-auto-next");
        if (isNextBtn(next) && correctShowing() && document.visibilityState === "visible") next.click();
        armedBtn = null;
      }, 1400);
    } else if (timer && (!next || !correctShowing())) {
      clearTimeout(timer); timer = null;
      if (armedBtn) armedBtn.classList.remove("lwn-auto-next"); armedBtn = null;
    }
  }
  function autoNext() {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return; pending = true;
      requestAnimationFrame(function () { pending = false; check(); });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "disabled"] });
  }

  function start() { css(); try { levelDropdown(); } catch (e) {} try { autoNext(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
