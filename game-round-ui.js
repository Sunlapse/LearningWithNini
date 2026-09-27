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
      document.getElementById("topScore")
    ].filter(Boolean);
    for (const node of candidates) {
      const nums = (node.textContent || "").match(/\d+/g);
      if (nums && nums.length) return Number(nums[nums.length - 1]);
    }
    return null;
  }

  const style = document.createElement("style");
  style.textContent = `
    .lwn-round-hud{
      position:fixed;top:82px;left:50%;transform:translateX(-50%);
      z-index:1450;display:flex;align-items:center;gap:10px;
      padding:8px 13px;border:1px solid rgba(112,64,223,.16);
      border-radius:999px;background:rgba(255,255,255,.96);
      color:#4b3489;box-shadow:0 9px 24px rgba(75,50,135,.14);
      backdrop-filter:blur(10px);font-family:"Nunito",Arial,sans-serif;
      font-weight:900;white-space:nowrap;pointer-events:none;
    }
    .lwn-round-hud strong{font-family:"Fredoka","Nunito",sans-serif;color:#6b38d5;font-size:1.03rem}
    .lwn-round-track{display:flex;gap:3px}
    .lwn-round-track i{display:block;width:8px;height:8px;border-radius:50%;background:#ded8eb}
    .lwn-round-track i.done{background:#7650df}
    .lwn-round-track i.now{background:#ef4d9a;box-shadow:0 0 0 3px rgba(239,77,154,.13)}
    @media(max-width:520px){
      .lwn-round-hud{top:70px;padding:7px 10px;gap:7px;font-size:.86rem}
      .lwn-round-track{gap:2px}.lwn-round-track i{width:6px;height:6px}
    }

    .lwn-finale{
      position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;
      padding:20px;background:rgba(42,29,83,.50);backdrop-filter:blur(8px);
      font-family:"Nunito",Arial,sans-serif;
    }
    .lwn-finale.show{display:flex}
    .lwn-finale-card{
      position:relative;overflow:hidden;width:min(560px,100%);text-align:center;
      padding:34px 24px 26px;border-radius:32px;background:linear-gradient(145deg,#fff,#f7f0ff 52%,#eef9ff);
      box-shadow:0 28px 80px rgba(39,24,91,.30);border:1px solid rgba(112,64,223,.12);
      animation:lwnPop .32s ease-out;
    }
    @keyframes lwnPop{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
    .lwn-finale-burst{font-size:3.8rem;line-height:1;margin-bottom:8px}
    .lwn-finale-card h2{margin:0;font-family:"Fredoka","Nunito",sans-serif;font-size:clamp(2.1rem,7vw,3.5rem);line-height:1;color:#6734d4}
    .lwn-finale-sub{font-weight:900;color:#ef4d9a;font-size:1.25rem;margin:10px 0 4px}
    .lwn-finale-score{font-weight:900;color:#544b74;margin:7px 0 22px;font-size:1.05rem}
    .lwn-finale-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .lwn-finale-actions button{border:0;border-radius:18px;padding:14px 16px;font-weight:1000;cursor:pointer}
    .lwn-finale-again{background:linear-gradient(135deg,#7b49e5,#6734d4);color:#fff}
    .lwn-finale-levels{background:#fff1f8;color:#b72d73}
    .lwn-confetti{position:absolute;inset:0;pointer-events:none}
    .lwn-confetti span{position:absolute;font-size:1.55rem;animation:lwnFloat 1.8s ease-in-out infinite alternate}
    .lwn-confetti span:nth-child(1){left:7%;top:8%}.lwn-confetti span:nth-child(2){right:8%;top:10%;animation-delay:.2s}
    .lwn-confetti span:nth-child(3){left:13%;bottom:13%;animation-delay:.4s}.lwn-confetti span:nth-child(4){right:13%;bottom:14%;animation-delay:.6s}
    .lwn-confetti span:nth-child(5){left:48%;top:4%;animation-delay:.8s}
    @keyframes lwnFloat{from{transform:translateY(-3px) rotate(-8deg)}to{transform:translateY(7px) rotate(10deg)}}
    @media(max-width:520px){
      .lwn-finale-card{padding:30px 18px 20px;border-radius:26px}
      .lwn-finale-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const hud = document.createElement("div");
  hud.className = "lwn-round-hud";
  hud.setAttribute("aria-live", "polite");
  hud.innerHTML = '<span>Question</span><strong><span class="lwn-current">1</span> of 10</strong><span class="lwn-round-track" aria-hidden="true"></span>';
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
    <div class="lwn-finale-card">
      <div class="lwn-confetti" aria-hidden="true"><span>⭐</span><span>🎉</span><span>✨</span><span>💜</span><span>🌟</span></div>
      <div class="lwn-finale-burst">🏆</div>
      <h2>10 / 10 Complete!</h2>
      <div class="lwn-finale-sub">You finished the whole challenge!</div>
      <div class="lwn-finale-score"></div>
      <div class="lwn-finale-actions">
        <button type="button" class="lwn-finale-again">Play Another Round</button>
        <button type="button" class="lwn-finale-levels">Choose Another Level</button>
      </div>
    </div>
  `;
  document.body.appendChild(finale);

  let finaleShown = false;

  function showFinale() {
    if (finaleShown) return;
    finaleShown = true;
    const score = scoreValue();
    finale.querySelector(".lwn-finale-score").textContent =
      score === null ? "Amazing work — all 10 are done." : "Final score: " + score + " ⭐";
    finale.classList.add("show");
  }

  function closeFinale() {
    finale.classList.remove("show");
    finaleShown = false;
    setTimeout(updateHud, 80);
  }

  finale.querySelector(".lwn-finale-again").addEventListener("click", closeFinale);
  finale.querySelector(".lwn-finale-levels").addEventListener("click", () => {
    closeFinale();
    const levels = document.getElementById("challenge-options");
    if (levels) setTimeout(() => levels.scrollIntoView({behavior:"smooth", block:"start"}), 80);
  });

  function isRoundFinishControl(control) {
    if (!control) return false;
    const text = (control.textContent || "").replace(/\s+/g, " ").trim();
    if (/Finish Round|Finish Case File|Start New Maze/i.test(text)) return true;
    if (control.id === "revealNextButton" && /Next Amount/i.test(text)) return true;
    return false;
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("button,a");
    const n = readRound();
    if (n === TOTAL && isRoundFinishControl(control)) {
      setTimeout(showFinale, 120);
    }
  }, true);

  const counter = currentCounterEl();
  if (counter) {
    new MutationObserver(updateHud).observe(counter, {childList:true, characterData:true, subtree:true});
  }
  updateHud();
})();