window.LWNLeaderboard = (() => {
  const URL = "https://wvcdihtphcjuegdkadsb.supabase.co";
  const KEY = "sb_publishable_Uso8SKT30uVsIDPxTzroIQ_kMCWOoaN";
  const GAMES = ["money","time","multiplication","division","place_value","number_battle","geometry","math_maze","daily_challenge","fraction","detective"];

  function getDeviceId(){
    let id=localStorage.getItem("lwnGlobalDeviceId");
    if(!id){
      id=(crypto.randomUUID?crypto.randomUUID():"lwn-"+Date.now()+"-"+Math.random().toString(36).slice(2));
      localStorage.setItem("lwnGlobalDeviceId",id);
    }
    return id;
  }

  async function syncProfile({name,avatar="⭐"}){
    const res=await fetch(URL+"/functions/v1/submit-score",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":KEY},
      body:JSON.stringify({
        action:"profile",
        player_name:String(name||"Nini").slice(0,24),
        avatar:String(avatar||"⭐").slice(0,8),
        device_id:getDeviceId()
      })
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||"Could not sync profile");
    return data;
  }

  async function saveScore({name,avatar="⭐",game,score,level=null,best_streak=0}){
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
      limit:String(limit)
    });
    const res=await fetch(URL+"/rest/v1/game_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load leaderboard");
    const rows=await res.json();
    return rows.map(r=>({name:r.player_name,avatar:r.avatar,game:r.game,score:r.score,level:r.level,best_streak:r.best_streak,updated_at:r.updated_at}));
  }

  async function all(limit=1000){
    const u=new URLSearchParams({
      select:"player_name,avatar,game,score,level,best_streak,updated_at",
      order:"score.desc,updated_at.asc",
      limit:String(limit)
    });
    const res=await fetch(URL+"/rest/v1/game_scores?"+u.toString(),{headers:{apikey:KEY}});
    if(!res.ok) throw new Error("Could not load leaderboard");
    return await res.json();
  }

  async function overall(limit=10){
    const rows=await all();
    const map=new Map();
    for(const r of rows){
      const key=(String(r.player_name||"Nini").trim().toLowerCase())+"|"+String(r.avatar||"⭐");
      if(!map.has(key)) map.set(key,{name:r.player_name||"Nini",avatar:r.avatar||"⭐",money:0,time:0,multiplication:0,division:0,place_value:0,number_battle:0,geometry:0,math_maze:0,daily_challenge:0,fraction:0,detective:0,total:0});
      const p=map.get(key);
      if(GAMES.includes(r.game)) p[r.game]=Math.max(p[r.game]||0,Number(r.score)||0);
    }
    const out=[...map.values()];
    out.forEach(p=>p.total=GAMES.reduce((s,g)=>s+(p[g]||0),0));
    out.sort((a,b)=>b.total-a.total||b.multiplication-a.multiplication||a.name.localeCompare(b.name));
    return out.slice(0,limit);
  }

  // Keep profile changes in sync with every saved game score on this browser.
  const nativeSetItem=Storage.prototype.setItem;
  if(!window.__lwnProfileStorageHook){
    window.__lwnProfileStorageHook=true;
    Storage.prototype.setItem=function(key,value){
      nativeSetItem.call(this,key,value);
      if(this===localStorage && key==="learningWithNiniProfileV1"){
        try{
          const p=JSON.parse(value);
          if(p&&p.name) setTimeout(()=>syncProfile({name:p.name,avatar:p.avatar||"⭐"}).catch(()=>{}),0);
        }catch{}
      }
    };
  }

  // On page load, reconcile an already-changed local profile with older global scores.
  try{
    const saved=JSON.parse(localStorage.getItem("learningWithNiniProfileV1")||"null");
    if(saved&&saved.name) setTimeout(()=>syncProfile({name:saved.name,avatar:saved.avatar||"⭐"}).catch(()=>{}),0);
  }catch{}

  return {saveScore,syncProfile,top,overall};
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
