/* Learn With Nini – read-aloud for young readers.
   window.LWNSay.speak(text) reads text with the device voice (math symbols spoken as words).
   On game pages a small "🗣️ Read it" button sits next to the question and reads the current question. */
(function () {
  if (window.LWNSay) return;
  var ok = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var NTH = { 2: "half", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth", 11: "eleventh", 12: "twelfth", 100: "hundredth" };
  function words(t) {
    t = String(t || "").replace(/\s+/g, " ");
    t = t.replace(/(\d+)\s*\/\s*(\d+)/g, function (m, n, d) { var w = NTH[+d]; if (!w) return n + " over " + d; if (+d === 2) w = +n === 1 ? "half" : "halves"; else if (+n !== 1) w += "s"; return n + " " + w; });
    return t.replace(/(\d)\s*¢/g, "$1 cents").replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/[−–]/g, " minus ").replace(/\+/g, " plus ").replace(/=/g, " equals ")
      .replace(/[□▢_]{1,}|\?(?=\s*$)/g, function (m) { return m === "?" ? "?" : " blank "; }).replace(/[<>]/g, function (m) { return m === "<" ? " is less than " : " is greater than "; })
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").replace(/equals \?/g, "equals what?").replace(/ \?(?= )/g, " what number").trim();
  }
  function speak(text) {
    if (!ok) return false;
    try { var u = new SpeechSynthesisUtterance(words(text)); u.lang = "en-US"; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } catch (e) { return false; }
  }
  window.LWNSay = { ok: ok, speak: speak, words: words };
  if (!ok) return;

  /* ---------- "Read it" button next to game questions ---------- */
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  // What to read on each game: the elements that hold the question (read in this order). The button goes after the last one.
  var MAP = {
    "daily-challenge.html": ["#q"], "boss.html": ["#q"],
    "multiplication-sprint.html": ["#equation"], "division-dash.html": ["#equation"], "story-map.html": ["#story"], "math-maze.html": ["#equation"],
    "number-battle.html": ["#prompt"], "geometry-builder.html": ["#prompt"], "length-lab.html": ["#prompt"],
    "capacity-lab.html": ["#prompt"], "weight-mass-lab.html": ["#prompt"], "place-value-challenge.html": ["#prompt", "#bigNumber"],
    "math-detective.html": ["#story", "#questionPrompt"], "time-match.html": ["#targetLabel", "#targetTime"],
    "money-match.html": [".target-label", "#target"], "fraction-builder.html": ["#title", "#sub"]
  };
  function visible(el) { return el && el.offsetParent !== null && el.textContent.trim().length > 0; }
  function css() {
    if (document.getElementById("lwnSayCss")) return;
    var s = document.createElement("style"); s.id = "lwnSayCss";
    s.textContent = ".lwn-say{display:inline-flex;align-items:center;gap:5px;margin:6px auto 0;min-height:40px;padding:6px 12px;border-radius:999px;border:2px solid #D7E5F6;background:#F4F8FF;color:#1E5FA8;font:800 14px/1 'Nunito',system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
      ".lwn-say:active{transform:translateY(1px)}.lwn-say-wrap{display:flex;justify-content:center;width:100%}" +
      ".lwn-say.abs{position:absolute;top:8px;right:8px;margin:0;z-index:3}.lwn-say-wrap.in-card{flex-basis:100%;margin-top:2px}.lwn-say-wrap.in-card .lwn-say{min-height:36px;margin-top:4px}";
    document.head.appendChild(s);
  }
  function els() { return (MAP[page] || []).map(function (s) { return document.querySelector(s); }).filter(visible); }
  function textFor() {
    var t = els().filter(function (el) { return !/^[?\s]*$/.test(el.textContent); }).map(function (el) { var x = (el.innerText || el.textContent).trim(); return /[.?!:]$/.test(x) ? x : x + "."; }).join(" ");
    return page === "money-match.html" ? t.replace(/\$(\d+)\.(\d\d)/g, function (m, d, c) { return (+d ? d + " dollars and " : "") + (+c) + " cents"; }) : t;
  }
  function attach() {
    var list = els(); if (!list.length) return;
    var q = list[list.length - 1];
    if (q.__lwnSay && document.body.contains(q.__lwnSay)) return;
    css();
    var b = document.createElement("button"); b.type = "button"; b.className = "lwn-say"; b.innerHTML = "🗣️ Read it"; b.setAttribute("aria-label", "Read the question out loud");
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); speak(textFor()); });
    if (page === "daily-challenge.html") {
      // put the button on its own line inside the question card, under the words, so it never covers them
      var card = q.closest(".qcard") || q.parentNode; card.style.flexWrap = "wrap";
      var w0 = document.createElement("div"); w0.className = "lwn-say-wrap in-card"; w0.appendChild(b); card.appendChild(w0);
      var old = card.querySelectorAll(".lwn-say-wrap.in-card"); for (var i = 0; i < old.length - 1; i++) old[i].remove();
    } else {
      var w = document.createElement("div"); w.className = "lwn-say-wrap"; w.appendChild(b);
      q.insertAdjacentElement("afterend", w);
    }
    q.__lwnSay = b;
  }
  var GAMES = Object.keys(MAP);
  if (GAMES.indexOf(page) >= 0) setInterval(attach, 1000);
  // stop talking when the page is hidden or a new question shows
  document.addEventListener("visibilitychange", function () { if (document.hidden) try { speechSynthesis.cancel(); } catch (e) {} });
})();
