window.LWNLeaderboard = (() => {
  const URL = "https://wvcdihtphcjuegdkadsb.supabase.co";
  const KEY = "sb_publishable_Uso8SKT30uVsIDPxTzroIQ_kMCWOoaN";
  const GAMES = ["money","time","multiplication","division","place_value","number_battle","geometry","math_maze","daily_challenge","fraction","detective","length","capacity","weight_mass"];
  const HIDDEN_NAMES = new Set(["nini"]);

  function getDeviceId(){
    let id=localStorage.getItem("lwnGlobalDeviceId");
    if(!id){
      id=(crypto.randomUUID?crypto.randomUUID():"lwn-"+Date.now()+"-"+Math.random().toString(36).slice(2));
      localStorage.setItem("lwnGlobalDeviceId",id);
    }
    return id;
  }

  let nicknamePromise=null;

  function storedProfile(){
    try{return JSON.parse(localStorage.getItem("learningWithNiniProfileV1")||"null")}catch{return null}
  }

  function setVisibleProfile(profile){
    const name=profile&&profile.name?profile.name:"Set nickname";
    const avatar=profile&&profile.avatar?profile.avatar:"⭐";
    ["nameTop","topAvatarName","appbarAvatarName","profileNameTop"].forEach(id=>{
      const node=document.getElementById(id); if(node) node.textContent=name;
    });
    ["avatarTop","topAvatarEmoji","appbarAvatarEmoji","profileAvatarTop"].forEach(id=>{
      const node=document.getElementById(id); if(node) node.textContent=avatar;
    });
    ["profileButton","profileBtn","topAvatarButton","appbarAvatarBtn"].forEach(id=>{
      const node=document.getElementById(id);
      if(node){node.setAttribute("aria-label",profile&&profile.name?"Change leaderboard nickname":"Set leaderboard nickname");node.title=profile&&profile.name?"Change leaderboard nickname":"Set leaderboard nickname";}
    });
  }

  function nicknameNeedsSetup(){
    const p=storedProfile();
    return !p || !String(p.name||"").trim() || String(p.name).trim().toLowerCase()==="nini";
  }

  function isGamePage(){
    const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    return !["","index.html","leaderboard.html","daily-challenge.html"].includes(page);
  }

  function removeNicknameNudge(){
    const n=document.getElementById("lwnNicknameNudge");
    if(n)n.remove();
  }

  function showNicknameNudge(){
    if(!isGamePage() || !nicknameNeedsSetup() || document.getElementById("lwnNicknameNudge"))return;

    const style=document.getElementById("lwnNicknameNudgeStyle")||document.createElement("style");
    style.id="lwnNicknameNudgeStyle";
    style.textContent=`
      #lwnNicknameNudge{
        width:min(680px,calc(100% - 24px));
        margin:12px auto 2px;
        border:0;
        border-radius:18px;
        padding:13px 16px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:9px;
        background:linear-gradient(135deg,#fff4c8,#f3e9ff);
        color:#50319f;
        box-shadow:0 10px 25px rgba(79,50,143,.10);
        font:900 15px/1.2 "Nunito",Arial,sans-serif;
        cursor:pointer;
      }
      #lwnNicknameNudge strong{font-family:"Fredoka","Nunito",sans-serif;font-size:16px}
      #lwnNicknameNudge .lwn-arrow{font-size:18px}
      @media(max-width:600px){
        #lwnNicknameNudge{
          width:calc(100% - 20px);
          margin:10px auto 4px;
          padding:14px 12px;
          border-radius:16px;
          font-size:14px;
        }
        #lwnNicknameNudge strong{font-size:15px}
      }`;
    if(!style.parentNode)document.head.appendChild(style);

    const n=document.createElement("button");
    n.id="lwnNicknameNudge";
    n.type="button";
    n.innerHTML='<span>🏆</span><strong>Set your leaderboard nickname</strong><span class="lwn-arrow">→</span>';
    n.addEventListener("click",()=>ensureLeaderboardNickname("", "⭐"));

    const header=document.querySelector(".topbar,.game-topbar,.appbar,.top");
    if(header&&header.parentNode)header.insertAdjacentElement("afterend",n);
    else document.body.prepend(n);
  }

  function relabelEmptyProfile(){
    if(nicknameNeedsSetup()){
      setTimeout(()=>{setVisibleProfile(null);showNicknameNudge();},0);
    }else{
      removeNicknameNudge();
    }
  }

  function ensureLeaderboardNickname(name,avatar,force=false){
    const p=storedProfile();
    const proposed=String(name||"").trim();
    if(!force&&p&&String(p.name||"").trim()&&String(p.name).trim().toLowerCase()!=="nini"){
      return Promise.resolve({name:String(p.name).trim().slice(0,24),avatar:p.avatar||avatar||"⭐"});
    }
    if(!force&&proposed&&proposed.toLowerCase()!=="nini"){
      return Promise.resolve({name:proposed.slice(0,24),avatar:avatar||"⭐"});
    }
    if(nicknamePromise)return nicknamePromise;

    nicknamePromise=new Promise(resolve=>{
      const overlay=document.createElement("div");
      overlay.id="lwnNicknameOverlay";
      overlay.innerHTML=`
        <div class="lwn-nickname-card" role="dialog" aria-modal="true" aria-labelledby="lwnNicknameTitle">
          <button class="lwn-nickname-close" type="button" aria-label="Close">×</button>
          <div class="lwn-nickname-emoji">🏆</div>
          <h2 id="lwnNicknameTitle">Join the leaderboard!</h2>
          <p>Choose a nickname so your scores show up as <strong>you</strong>.</p>
          <label>Leaderboard nickname
            <input id="lwnNicknameInput" maxlength="24" autocomplete="off" placeholder="Example: Eric or Math Dragon">
          </label>
          <div class="lwn-avatar-label">Choose an avatar</div>
          <div class="lwn-avatar-row">
            <button type="button" data-av="⭐" class="selected">⭐</button>
            <button type="button" data-av="🐱">🐱</button>
            <button type="button" data-av="🐰">🐰</button>
            <button type="button" data-av="🌈">🌈</button>
            <button type="button" data-av="❤️">❤️</button>
          </div>
          <button class="lwn-nickname-save" type="button">Save nickname</button>
          <button class="lwn-nickname-skip" type="button">Use an anonymous Math Star name</button>
        </div>`;
      const style=document.createElement("style");
      style.textContent=`
        #lwnNicknameOverlay{position:fixed;inset:0;z-index:99999;background:rgba(38,27,80,.42);display:grid;place-items:center;padding:18px;font-family:"Nunito",Arial,sans-serif}
        .lwn-nickname-card{width:min(460px,100%);background:#fff;border-radius:28px;padding:24px;box-shadow:0 28px 70px rgba(45,29,96,.28);position:relative;text-align:center;color:#282061}
        .lwn-nickname-close{position:absolute;right:14px;top:12px;border:0;background:#f1ecff;width:38px;height:38px;border-radius:50%;font-size:24px;color:#6542bd}
        .lwn-nickname-emoji{font-size:34px}.lwn-nickname-card h2{font-family:"Fredoka","Nunito",sans-serif;color:#5d35c1;font-size:28px;margin:6px 0}
        .lwn-nickname-card p{color:#6e6688;font-weight:800;line-height:1.4;margin:0 0 16px}
        .lwn-nickname-card label{display:block;text-align:left;font-weight:900;color:#3f3475}
        .lwn-nickname-card input{width:100%;margin-top:6px;border:2px solid #ddd4f3;border-radius:15px;padding:13px 14px;font:inherit;font-weight:800;outline:none}
        .lwn-nickname-card input:focus{border-color:#7448dd;box-shadow:0 0 0 4px rgba(116,72,221,.10)}
        .lwn-avatar-label{text-align:left;font-weight:900;margin:14px 0 7px;color:#3f3475}.lwn-avatar-row{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
        .lwn-avatar-row button{border:2px solid #e8e1f6;border-radius:14px;background:#faf9ff;min-height:50px;font-size:23px}.lwn-avatar-row button.selected{border-color:#7040df;background:#eee8ff}
        .lwn-nickname-save,.lwn-nickname-skip{width:100%;border:0;border-radius:16px;font-weight:1000;cursor:pointer}
        .lwn-nickname-save{margin-top:16px;padding:14px;background:linear-gradient(135deg,#ef579e,#7547dd);color:#fff;font-size:18px}
        .lwn-nickname-skip{margin-top:8px;padding:10px;background:transparent;color:#72688c}
      `;
      document.head.appendChild(style);document.body.appendChild(overlay);
      const input=overlay.querySelector("#lwnNicknameInput");
      const existingName=p&&String(p.name||"").trim()&&String(p.name).trim().toLowerCase()!=="nini"
        ?String(p.name).trim().slice(0,24)
        :(proposed&&proposed.toLowerCase()!=="nini"?proposed.slice(0,24):"");
      let selectedAvatar=(p&&p.avatar)||avatar||"⭐";
      input.value=existingName;
      overlay.querySelectorAll("[data-av]").forEach(b=>{
        b.classList.toggle("selected",b.dataset.av===selectedAvatar);
        b.addEventListener("click",()=>{
          selectedAvatar=b.dataset.av;overlay.querySelectorAll("[data-av]").forEach(x=>x.classList.toggle("selected",x===b));
        });
      });
      function finish(profile){
        overlay.remove();style.remove();nicknamePromise=null;
        localStorage.setItem("learningWithNiniProfileV1",JSON.stringify(profile));
        localStorage.setItem("niniPlayerName",profile.name);
        localStorage.setItem("niniAvatar",profile.avatar);
        setVisibleProfile(profile);removeNicknameNudge();resolve(profile);
      }
      overlay.querySelector(".lwn-nickname-save").addEventListener("click",()=>{
        const entered=String(input.value||"").trim().replace(/\s+/g," ").slice(0,24);
        if(!entered){input.focus();return}
        finish({name:entered,avatar:selectedAvatar});
      });
      overlay.querySelector(".lwn-nickname-skip").addEventListener("click",()=>{
        let anon=localStorage.getItem("dm-anon-name");
        if(!anon){anon="Math Star "+(100+Math.floor(Math.random()*900));localStorage.setItem("dm-anon-name",anon)}
        finish({name:anon,avatar:selectedAvatar});
      });
      overlay.querySelector(".lwn-nickname-close").addEventListener("click",()=>{
        if(force&&existingName){
          finish({name:existingName,avatar:selectedAvatar});
          return;
        }
        let anon=localStorage.getItem("dm-anon-name");
        if(!anon){anon="Math Star "+(100+Math.floor(Math.random()*900));localStorage.setItem("dm-anon-name",anon)}
        finish({name:anon,avatar:selectedAvatar});
      });
      setTimeout(()=>input.focus(),50);
    });
    return nicknamePromise;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",relabelEmptyProfile);
  else relabelEmptyProfile();

  async function saveScore({name,avatar="⭐",game,score,level=null,best_streak=0}){
    const player=await ensureLeaderboardNickname(name,avatar);
    name=player.name;avatar=player.avatar;
    const res=await fetch(URL+"/functions/v1/submit-score",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":KEY},
      body:JSON.stringify({
        player_name:String(name||"Nini").slice(0,24),
        avatar:String(avatar||"⭐").slice(0,8),
        game,
        score:Number(score)||0,
        level,
        best_streak:Number(best_streak)||0,
        device_id:getDeviceId()
      })
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||"Could not save score");
    return data;
  }

  async function top(game,limit=10){
    const u=new URLSearchParams({
      select:"player_name,avatar,game,score,level,best_streak,updated_at",
      game:"eq."+game,
      order:"score.desc,updated_at.asc",
      limit:String(Math.max(limit*3,30))
    });
    const res=await fetch(URL+"/rest/v1/game_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load leaderboard");
    const rows=await res.json();
    return rows
      .filter(r=>!HIDDEN_NAMES.has(String(r.player_name||"").trim().toLowerCase()))
      .slice(0,limit)
      .map(r=>({name:r.player_name,avatar:r.avatar,game:r.game,score:r.score,level:r.level,best_streak:r.best_streak,updated_at:r.updated_at}));
  }

  async function all(limit=1000){
    const u=new URLSearchParams({
      select:"player_name,avatar,game,score,level,best_streak,updated_at",
      order:"score.desc,updated_at.asc",
      limit:String(limit)
    });
    const res=await fetch(URL+"/rest/v1/game_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load leaderboard");
    const rows=await res.json();
    return rows.filter(r=>!HIDDEN_NAMES.has(String(r.player_name||"").trim().toLowerCase()));
  }

  async function dailyChallenge({date=null,minutes=20,limit=10}={}){
    const u=new URLSearchParams({
      select:"player_name,avatar,score,grade,minutes,challenge_date,best_streak,updated_at",
      minutes:"eq."+String(minutes||20),
      order:"score.desc,updated_at.asc",
      limit:"200"
    });
    if(date)u.set("challenge_date","eq."+date);

    const res=await fetch(URL+"/rest/v1/daily_challenge_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load Daily Challenge leaderboard");
    const rows=await res.json();

    const map=new Map();
    for(const r of rows){
      const key=String(r.player_name||"Player").trim().toLowerCase();
      const item={
        name:r.player_name||"Player",
        avatar:r.avatar||"⭐",
        score:Number(r.score)||0,
        grade:String(r.grade||""),
        minutes:Number(r.minutes)||0,
        date:String(r.challenge_date||""),
        best_streak:Number(r.best_streak)||0,
        updated_at:r.updated_at||""
      };
      const prev=map.get(key);
      if(!prev || item.score>prev.score || (item.score===prev.score && String(item.updated_at)<String(prev.updated_at))){
        map.set(key,item);
      }
    }

    const out=[...map.values()];
    out.sort((a,b)=>b.score-a.score || b.best_streak-a.best_streak || String(a.updated_at).localeCompare(String(b.updated_at)) || a.name.localeCompare(b.name));
    return out.slice(0,limit);
  }

  async function dailyHistory({name,minutes=20,limit=30}={}){
    name=String(name||"").trim();
    if(!name)return [];
    const u=new URLSearchParams({
      select:"player_name,avatar,score,grade,minutes,challenge_date,best_streak,updated_at",
      player_name:"eq."+name,
      minutes:"eq."+String(minutes||20),
      order:"challenge_date.asc,score.desc,updated_at.asc",
      limit:"500"
    });

    const res=await fetch(URL+"/rest/v1/daily_challenge_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load Daily Challenge history");
    const rows=await res.json();

    const byDate=new Map();
    for(const r of rows){
      const date=String(r.challenge_date||"");
      if(!date)continue;
      const item={
        name:r.player_name||name,
        avatar:r.avatar||"⭐",
        score:Number(r.score)||0,
        grade:String(r.grade||""),
        minutes:Number(r.minutes)||0,
        date,
        best_streak:Number(r.best_streak)||0,
        updated_at:r.updated_at||""
      };
      const prev=byDate.get(date);
      if(!prev || item.score>prev.score || (item.score===prev.score && String(item.updated_at)<String(prev.updated_at))){
        byDate.set(date,item);
      }
    }

    const out=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
    out.forEach((x,i)=>x.day=i+1);
    return out.slice(-Math.max(1,Number(limit)||30)).reverse();
  }

  async function overall(limit=10){
    const rows=await all();
    const map=new Map();
    for(const r of rows){
      const key=String(r.player_name||"Nini").trim().toLowerCase();
      if(!map.has(key)) map.set(key,{name:r.player_name||"Nini",avatar:r.avatar||"⭐",latest:"",money:0,time:0,multiplication:0,division:0,place_value:0,number_battle:0,geometry:0,math_maze:0,daily_challenge:0,fraction:0,detective:0,length:0,capacity:0,weight_mass:0,total:0});
      const p=map.get(key);
      if(!p.latest || String(r.updated_at||"")>p.latest){p.avatar=r.avatar||"⭐";p.name=r.player_name||"Nini";p.latest=String(r.updated_at||"")}
      if(GAMES.includes(r.game)) p[r.game]=Math.max(p[r.game]||0,Number(r.score)||0);
    }
    const out=[...map.values()];
    out.forEach(p=>p.total=GAMES.reduce((s,g)=>s+(p[g]||0),0));
    out.sort((a,b)=>b.total-a.total||b.multiplication-a.multiplication||a.name.localeCompare(b.name));
    return out.slice(0,limit);
  }

  function setNickname(){return ensureLeaderboardNickname("","⭐",true)}
  function getProfile(){return storedProfile()}
  return {saveScore,top,overall,dailyChallenge,dailyHistory,setNickname,getProfile};
})();

/* Playful browser-tab title when Learn With Nini is in the background. */
(() => {
  const originalTitle = document.title;
  const hiddenTitles = [
    "Math misses you! 💜",
    "Nini saved your spot ✏️",
    "Your math adventure is waiting ⭐",
    "One more problem? 🧠",
    "Your streak is waiting 🔥",
    "Come back for some math! 🌈"
  ];
  let timer = null;
  let messageIndex = Math.floor(Math.random() * hiddenTitles.length);

  function nextHiddenTitle() {
    document.title = hiddenTitles[messageIndex % hiddenTitles.length];
    messageIndex += 1;
  }

  function restoreTitle() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    document.title = originalTitle;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      nextHiddenTitle();
      if (!timer) timer = setInterval(nextHiddenTitle, 5000);
    } else {
      restoreTitle();
    }
  });

  window.addEventListener("pageshow", () => {
    if (!document.hidden) restoreTitle();
  });
})();
