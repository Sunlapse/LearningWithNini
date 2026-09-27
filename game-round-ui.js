(() => {
  const TOTAL = 10;

  function currentCounterEl() {
    return document.getElementById("questionText") || document.getElementById("qText");
  }

  function readRound() {
    const node = currentCounterEl();
    if (!node) return 1;
    const text = node.textContent || "";
    const m = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
    if (!m) return 1;
    return Math.max(1, Math.min(Number(m[2]) || TOTAL, Number(m[1]) || 1));
  }

  function scoreValue() {
    const candidates = [
      document.getElementById("score"),
      document.getElementById("scoreDisplay"),
      document.getElementById("topScore"),
      document.getElementById("appbarScore")
    ].filter(Boolean);

    for (const node of candidates) {
      const nums = (node.textContent || "").match(/\d+/g);
      if (nums && nums.length) return Number(nums[nums.length - 1]);
    }
    return null;
  }

  function activeFinishControl() {
    return (
      document.querySelector("#checkBtn.next") ||
      document.querySelector("#check.next") ||
      document.querySelector("#mainActionBtn.next-btn") ||
      document.querySelector("#revealNextButton.btn-green") ||
      [...document.querySelectorAll("button,a")].find((el) =>
        /Finish Round|Finish Case File|Start New Maze/i.test((el.textContent || "").replace(/\s+/g, " ").trim())
      ) ||
      null
    );
  }

  const style = document.createElement("style");
  style.textContent = `
    .lwn-round-hud{
      position:fixed;
      top:82px;
      left:50%;
      transform:translateX(-50%);
      z-index:7000;
      display:flex;
      align-items:center;
      gap:9px;
      padding:9px 14px;
      border:2px solid rgba(112,64,223,.16);
      border-radius:999px;
      background:rgba(255,255,255,.98);
      color:#4b3489;
      box-shadow:0 10px 28px rgba(75,50,135,.18);
      backdrop-filter:blur(12px);
      font-family:"Nunito",Arial,sans-serif;
      font-weight:900;
      white-space:nowrap;
      pointer-events:none;
    }
    .lwn-round-hud .lwn-label{color:#756a92;font-size:.88rem}
    .lwn-round-hud strong{
      font-family:"Fredoka","Nunito",sans-serif;
      color:#6b38d5;
      font-size:1.12rem;
    }
    .lwn-round-track{display:flex;gap:3px}
    .lwn-round-track i{
      display:block;width:9px;height:9px;border-radius:50%;
      background:#ded8eb;transition:.2s ease;
    }
    .lwn-round-track i.done{background:#7650df}
    .lwn-round-track i.now{
      background:#ef4d9a;
      transform:scale(1.2);
      box-shadow:0 0 0 3px rgba(239,77,154,.14);
    }

    @media(max-width:1080px){
      .lwn-round-hud{
        top:auto;
        bottom:max(12px,env(safe-area-inset-bottom));
        left:auto;
        right:12px;
        transform:none;
        padding:10px 13px;
        box-shadow:0 12px 32px rgba(75,50,135,.22);
      }
    }
    @media(max-width:520px){
      .lwn-round-hud{right:8px;bottom:max(8px,env(safe-area-inset-bottom));padding:8px 10px;gap:6px}
      .lwn-round-hud .lwn-label{display:none}
      .lwn-round-hud strong{font-size:1rem}
      .lwn-round-track{gap:2px}
      .lwn-round-track i{width:6px;height:6px}
    }

    .lwn-finale{
      position:fixed;
      inset:0;
      z-index:10000;
      display:none;
      align-items:center;
      justify-content:center;
      padding:20px;
      overflow:hidden;
      background:
        radial-gradient(circle at 50% 38%,rgba(255,255,255,.22),transparent 24%),
        rgba(42,29,83,.62);
      backdrop-filter:blur(9px);
      font-family:"Nunito",Arial,sans-serif;
    }
    .lwn-finale.show{display:flex}
    .lwn-finale-card{
      position:relative;
      z-index:3;
      overflow:visible;
      width:min(600px,100%);
      text-align:center;
      padding:38px 26px 28px;
      border-radius:36px;
      background:linear-gradient(145deg,#fff,#f8f1ff 50%,#eaf8ff);
      box-shadow:0 30px 90px rgba(39,24,91,.38);
      border:2px solid rgba(255,255,255,.78);
      animation:lwnPop .45s cubic-bezier(.2,1.35,.4,1);
    }
    @keyframes lwnPop{
      0%{transform:scale(.65) rotate(-2deg);opacity:0}
      70%{transform:scale(1.04) rotate(.5deg);opacity:1}
      100%{transform:scale(1) rotate(0)}
    }
    .lwn-finale-kicker{
      display:inline-flex;
      padding:7px 15px;
      border-radius:999px;
      background:#fff2c8;
      color:#7b5a00;
      font-weight:1000;
      font-size:1rem;
      margin-bottom:12px;
      box-shadow:0 7px 18px rgba(120,88,20,.10);
    }
    .lwn-finale-burst{
      font-size:5.2rem;
      line-height:1;
      margin-bottom:8px;
      animation:lwnTrophy 1s ease-in-out infinite alternate;
    }
    @keyframes lwnTrophy{
      from{transform:translateY(0) rotate(-5deg) scale(1)}
      to{transform:translateY(-7px) rotate(5deg) scale(1.07)}
    }
    .lwn-finale-card h2{
      margin:0;
      font-family:"Fredoka","Nunito",sans-serif;
      font-size:clamp(2.7rem,8vw,4.6rem);
      line-height:.95;
      letter-spacing:-.035em;
      color:#6734d4;
      text-shadow:0 3px 0 rgba(255,255,255,.85);
    }
    .lwn-finale-big{
      margin-top:8px;
      font-family:"Fredoka","Nunito",sans-serif;
      font-size:clamp(2rem,6vw,3.2rem);
      color:#ef4d9a;
      line-height:1;
    }
    .lwn-finale-sub{
      font-weight:1000;
      color:#51486f;
      font-size:1.2rem;
      margin:14px 0 4px;
    }
    .lwn-finale-score{
      font-weight:1000;
      color:#5c3bb0;
      margin:8px 0 24px;
      font-size:1.22rem;
    }
    .lwn-finale-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }
    .lwn-finale-actions button{
      border:0;
      border-radius:19px;
      padding:15px 17px;
      font-weight:1000;
      cursor:pointer;
      font-size:1rem;
    }
    .lwn-finale-again{
      background:linear-gradient(135deg,#7b49e5,#6734d4);
      color:#fff;
      box-shadow:0 10px 22px rgba(103,52,212,.22);
    }
    .lwn-finale-levels{background:#fff0f8;color:#b72d73}

    .lwn-confetti-stage{
      position:absolute;
      inset:0;
      z-index:1;
      pointer-events:none;
      overflow:hidden;
    }
    .lwn-confetti-piece{
      position:absolute;
      top:-12vh;
      width:12px;
      height:20px;
      border-radius:3px;
      opacity:.96;
      animation:lwnConfettiFall var(--dur) linear var(--delay) forwards;
      transform:translate3d(0,-15vh,0) rotate(0deg);
    }
    .lwn-confetti-piece.circle{border-radius:50%;width:13px;height:13px}
    .lwn-confetti-piece.star{
      width:auto;height:auto;background:none!important;
      font-size:1.4rem;line-height:1;
    }
    @keyframes lwnConfettiFall{
      0%{transform:translate3d(0,-15vh,0) rotate(0deg)}
      35%{transform:translate3d(var(--drift1),35vh,0) rotate(320deg)}
      70%{transform:translate3d(var(--drift2),78vh,0) rotate(680deg)}
      100%{transform:translate3d(var(--drift3),115vh,0) rotate(980deg)}
    }
    .lwn-firework{
      position:absolute;
      z-index:2;
      font-size:3rem;
      pointer-events:none;
      animation:lwnFirework .9s ease-out both;
    }
    .lwn-firework.one{left:7%;top:18%}
    .lwn-firework.two{right:8%;top:22%;animation-delay:.15s}
    .lwn-firework.three{left:12%;bottom:14%;animation-delay:.3s}
    .lwn-firework.four{right:10%;bottom:14%;animation-delay:.45s}
    @keyframes lwnFirework{
      0%{transform:scale(.1) rotate(-20deg);opacity:0}
      45%{transform:scale(1.25) rotate(8deg);opacity:1}
      100%{transform:scale(1) rotate(0);opacity:.95}
    }

    @media(max-width:520px){
      .lwn-finale{padding:14px}
      .lwn-finale-card{padding:30px 17px 20px;border-radius:28px}
      .lwn-finale-burst{font-size:4.4rem}
      .lwn-finale-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const hud = document.createElement("div");
  hud.className = "lwn-round-hud";
  hud.setAttribute("aria-live", "polite");
  hud.innerHTML = '<span class="lwn-label">Progress</span><strong>Question <span class="lwn-current">1</span> of 10</strong><span class="lwn-round-track" aria-hidden="true"></span>';
  document.body.appendChild(hud);

  const track = hud.querySelector(".lwn-round-track");
  for (let i = 1; i <= TOTAL; i++) {
    const dot = document.createElement("i");
    dot.dataset.n = String(i);
    track.appendChild(dot);
  }

  function updateHud() {
    const n = readRound();
    hud.querySelector(".lwn-current").textContent = String(n);
    track.querySelectorAll("i").forEach((dot, idx) => {
      const step = idx + 1;
      dot.classList.toggle("done", step < n);
      dot.classList.toggle("now", step === n);
    });
  }

  const finale = document.createElement("div");
  finale.className = "lwn-finale";
  finale.setAttribute("role", "dialog");
  finale.setAttribute("aria-modal", "true");
  finale.setAttribute("aria-label", "Round complete");
  finale.innerHTML = `
    <div class="lwn-confetti-stage" aria-hidden="true"></div>
    <div class="lwn-firework one" aria-hidden="true">🎉</div>
    <div class="lwn-firework two" aria-hidden="true">✨</div>
    <div class="lwn-firework three" aria-hidden="true">🌟</div>
    <div class="lwn-firework four" aria-hidden="true">🎊</div>
    <div class="lwn-finale-card">
      <div class="lwn-finale-kicker">ROUND COMPLETE</div>
      <div class="lwn-finale-burst">🏆</div>
      <h2>YOU DID IT!</h2>
      <div class="lwn-finale-big">10 / 10</div>
      <div class="lwn-finale-sub">Amazing work — you finished every question!</div>
      <div class="lwn-finale-score"></div>
      <div class="lwn-finale-actions">
        <button type="button" class="lwn-finale-again">🎮 Play Another Round</button>
        <button type="button" class="lwn-finale-levels">⭐ Choose Another Level</button>
      </div>
    </div>
  `;
  document.body.appendChild(finale);

  let finaleShown = false;
  let suppressAdvanceFinale = false;

  function buildConfetti() {
    const stage = finale.querySelector(".lwn-confetti-stage");
    stage.innerHTML = "";
    const colors = ["#ef4d9a","#6f40df","#2f9df5","#14b8a6","#ffbf27","#ff7a59","#a96ff7"];
    const icons = ["⭐","✨","💜","🌟"];
    for (let i = 0; i < 86; i++) {
      const p = document.createElement("span");
      const useStar = i % 11 === 0;
      p.className = "lwn-confetti-piece" + (i % 4 === 0 ? " circle" : "") + (useStar ? " star" : "");
      p.style.left = (Math.random() * 100) + "%";
      p.style.setProperty("--dur", (2.3 + Math.random() * 2.2) + "s");
      p.style.setProperty("--delay", (Math.random() * .65) + "s");
      p.style.setProperty("--drift1", ((Math.random() - .5) * 90) + "px");
      p.style.setProperty("--drift2", ((Math.random() - .5) * 160) + "px");
      p.style.setProperty("--drift3", ((Math.random() - .5) * 220) + "px");
      if (useStar) {
        p.textContent = icons[Math.floor(Math.random() * icons.length)];
      } else {
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      stage.appendChild(p);
    }
  }

  function showFinale() {
    if (finaleShown) return;
    finaleShown = true;
    buildConfetti();
    const score = scoreValue();
    finale.querySelector(".lwn-finale-score").textContent =
      score === null ? "Fantastic job!" : "Final score: " + score + " ⭐";
    finale.classList.add("show");
  }

  function closeFinale() {
    finale.classList.remove("show");
    finaleShown = false;
    setTimeout(updateHud, 80);
  }

  function advanceRound() {
    const control = activeFinishControl();
    closeFinale();
    if (control) {
      suppressAdvanceFinale = true;
      setTimeout(() => {
        control.click();
        setTimeout(() => {
          suppressAdvanceFinale = false;
          updateHud();
        }, 250);
      }, 80);
    }
  }

  finale.querySelector(".lwn-finale-again").addEventListener("click", advanceRound);
  finale.querySelector(".lwn-finale-levels").addEventListener("click", () => {
    closeFinale();
    const levels = document.getElementById("challenge-options");
    if (levels) setTimeout(() => levels.scrollIntoView({behavior:"smooth", block:"start"}), 80);
  });

  function isRoundFinishControl(control) {
    if (!control) return false;
    const text = (control.textContent || "").replace(/\s+/g, " ").trim();
    if (/Finish Round|Finish Case File|Start New Maze/i.test(text)) return true;
    if (control.id === "revealNextButton" && control.classList.contains("btn-green")) return true;
    return false;
  }

  function maybeShowFinale() {
    if (suppressAdvanceFinale || finaleShown) return;
    if (readRound() !== TOTAL) return;
    const control = activeFinishControl();
    if (control && isRoundFinishControl(control)) {
      setTimeout(showFinale, 180);
    }
  }

  document.addEventListener("click", (event) => {
    if (suppressAdvanceFinale) return;
    const control = event.target.closest("button,a");
    if (readRound() === TOTAL && isRoundFinishControl(control)) {
      setTimeout(showFinale, 80);
      return;
    }
    // Re-check shortly after any game control changes state.
    setTimeout(() => {
      updateHud();
      maybeShowFinale();
    }, 140);
  }, true);

  const counter = currentCounterEl();
  if (counter) {
    new MutationObserver(() => {
      updateHud();
    }).observe(counter, {childList:true, characterData:true, subtree:true});
  }

  // Lightweight fallback for game state changes. Avoid observing the whole DOM,
  // which can create a mutation loop on mobile browsers.
  setInterval(() => {
    updateHud();
    maybeShowFinale();
  }, 500);

  updateHud();
  maybeShowFinale();
})();