// ---- skills: Daily Challenge / Quick Dash question types grouped into parent-friendly topics ----
const TOPICS = {
  time: { name: "Telling time", url: "time-match.html" },
  money: { name: "Money", url: "money-match.html" },
  dec: { name: "Decimals", url: "place-value-challenge.html" },
  frac: { name: "Fractions", url: "fraction-builder.html" },
  measure: { name: "Measuring & shapes", url: "length-lab.html" },
  word: { name: "Word problems", url: "math-detective.html" },
  place: { name: "Place value & rounding", url: "place-value-challenge.html" },
  div: { name: "Division", url: "division-dash.html" },
  mult: { name: "Multiplication", url: "multiplication-sprint.html" },
  addsub: { name: "Adding & subtracting", url: "math-maze.html" },
  pattern: { name: "Patterns & data", url: "math-maze.html" }
};
function topicOf(t) {
  t = String(t || "");
  if (/time|clock/i.test(t)) return "time";
  if (/money|price|budget|bills|coin|sticker|exactNeed|carnival/i.test(t)) return "money";
  if (/^dec/i.test(t)) return "dec";
  if (/frac/i.test(t)) return "frac";
  if (/areaModel|partial|splitArray|breakApart3|combineFacts|commutative|associative|ninePattern|skipCount|equalGroup|array|factorPair|^mult|missing$|multStory|rowsStory/i.test(t)) return "mult";
  if (/area|perim|angle|volume|measure/i.test(t)) return "measure";
  if (/word|story|twoStep|multiStep|goalTwoStep|difference|teamScore|startUnknown|older|compareMore|exactNeed/i.test(t)) return "word";
  if (/place|round|expanded|compare2|digitSwap|hundredChart|lessBy|sumPlace/i.test(t)) return "place";
  if (/div|equalShares/i.test(t)) return "div";
  if (/add|sub|makeTen|doubles|compensation|decompose|openNumberLine|twoWays|targetPair|pairs/i.test(t)) return "addsub";
  if (/pattern|dataTable/i.test(t)) return "pattern";
  return "";
}
function skillSummary(skills, weekDays) {
  const tot = {};
  for (const d of weekDays) {
    const day = skills[d] || {};
    for (const t of Object.keys(day)) {
      const k = topicOf(t); if (!k) continue;
      const c = Array.isArray(day[t]) ? day[t] : [0, 0];
      const o = tot[k] || (tot[k] = { k, right: 0, tried: 0 });
      o.right += Number(c[0]) || 0; o.tried += Number(c[1]) || 0;
    }
  }
  const list = Object.values(tot).filter((x) => x.tried >= 4).map((x) => ({ ...x, acc: Math.round(x.right / x.tried * 100) }));
  const strong = list.filter((x) => x.acc >= 85).sort((a, b) => b.acc - a.acc || b.tried - a.tried).slice(0, 2);
  const practice = list.filter((x) => x.acc < 75).sort((a, b) => a.acc - b.acc || b.tried - a.tried).slice(0, 2);
  return { list, strong, practice };
}

// data = the account's saved progress
// opts: now, unsubUrl, globalRows (this nickname's Daily Challenge rows), ranks [{label,rank}], dash {score,secs}, caseInfo
function buildReport(data, opts) {
  const now = opts.now || Date.now();
  const today = hiDay(0, now);
  const week = [], prev = [];
  for (let i = 6; i >= 0; i--) week.push(hiDay(-i, now));
  for (let i = 13; i >= 7; i--) prev.push(hiDay(-i, now));
  const fullLog = (J(data["dm-log"], []) || []).filter((r) => r && r.date);
  const gRows = (opts.globalRows || []).filter((r) => r && r.challenge_date);
  const xp = J(data["lwn-xp-v1"], {}) || {}, days = xp.days || {}, games = xp.games || {};
  const prof = J(data["learningWithNiniProfileV1"], {}) || {};
  const settings = J(data["dm-settings"], {}) || {};
  const name = prof.name || data["niniPlayerName"] || settings.name || "Your math star";
  const icon = prof.avatar || data["niniAvatar"] || "⭐";
  // Daily Challenge sessions (Quick Dash kept apart): this device's history plus leaderboard rows from other devices
  const sessions = fullLog.filter((r) => !r.dash && Number(r.mins) >= 10).map((r) => ({
    date: r.date, secs: Number(r.secs) || Number(r.mins) * 60 || 0, mins: Number(r.mins) || 0,
    att: Number(r.attempted) || 0, cor: Number(r.correct) || 0, pts: Number(r.points) || 0, grade: r.grade, mode: r.mode
  }));
  const dashes = fullLog.filter((r) => r.dash || Number(r.mins) < 10);
  const seen = new Set(sessions.map((s) => s.date + "|" + s.mins + "|" + (s.mode || "standard")));
  for (const g of gRows) {
    const k = g.challenge_date + "|" + Number(g.minutes) + "|" + (g.mode || "standard");
    if (seen.has(k)) continue;
    seen.add(k);
    sessions.push({ date: g.challenge_date, secs: (Number(g.minutes) || 0) * 60, mins: Number(g.minutes) || 0, att: 0, cor: 0, pts: Number(g.score) || 0, grade: g.grade, mode: g.mode });
  }
  const dailyDates = new Set(sessions.map((s) => s.date).concat(dashes.map((r) => r.date)));
  const frozen = new Set((J(data["lwn-freeze-v1"], {}) || {}).used || []);
  const activeOn = (d) => (Number(days[d]) || 0) > 0 || dailyDates.has(d);
  function sum(range) {
    const ss = sessions.filter((s) => range.includes(s.date));
    const ds = dashes.filter((r) => range.includes(r.date));
    const att = ss.reduce((a, s) => a + s.att, 0) + ds.reduce((a, r) => a + (Number(r.attempted) || 0), 0);
    const cor = ss.reduce((a, s) => a + s.cor, 0) + ds.reduce((a, r) => a + (Number(r.correct) || 0), 0);
    const best = ss.slice().sort((a, b) => b.pts - a.pts)[0] || null;
    return {
      ss, ds,
      active: range.filter(activeOn).length,
      mins: Math.round((ss.reduce((a, s) => a + s.secs, 0) + ds.reduce((a, r) => a + (Number(r.secs) || 180), 0)) / 60),
      acc: att ? Math.round(cor / att * 100) : null,
      xp: range.reduce((a, d) => a + (Number(days[d]) || 0), 0),
      best
    };
  }
  const W = sum(week), P = sum(prev);
  // streak: practice days in a row (Daily Challenge or Quick Dash; a streak freeze keeps it alive), ending today or yesterday
  let d = today, streak = 0;
  if (!dailyDates.has(d) && !frozen.has(d)) d = shiftDay(d, -1);
  while (dailyDates.has(d) || frozen.has(d)) { streak++; d = shiftDay(d, -1); }
  const latest = sessions.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0] || {};
  const grade = latest.grade || settings.grade;
  const badgeMap = J(data["lwn-badges-v1"], {}) || {};
  const newBadges = Object.keys(badgeMap).filter((k) => week.includes(String(badgeMap[k]).slice(0, 10)));
  const played = Object.keys(GAMES).filter((k) => (Number(games[k]) || 0) > 0).sort((a, b) => games[b] - games[a]);
  const path = pathProgress(games, Math.max(Number(xp.dailyDone) || 0, dailyDates.size), J(data["lwn-boss-v1"], {}) || {});
  const skills = skillSummary(J(data["lwn-skills-v1"], {}) || {}, week);
  // personal best: this week's best Daily Challenge beats every earlier one of the same length
  const pb = W.best && W.best.pts > 0 && !sessions.some((s) => !week.includes(s.date) && s.mins === W.best.mins && s.pts >= W.best.pts) && sessions.some((s) => !week.includes(s.date)) ? W.best : null;
  const ranks = (opts.ranks || []).filter((r) => r.rank <= 10).slice(0, 3);
  const dash = opts.dash && opts.dash.score > 0 ? opts.dash : null;
  const cs = opts.caseInfo || null;
  const stats = { name, active: W.active, mins: W.mins, acc: W.acc, xp: W.xp, challenges: W.ss.length, dashes: W.ds.length, streak, path: path.done + "/" + path.total, prevActive: P.active };
  const first = name;
  const fmtD = (x) => new Date(x + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const dow = (x) => new Date(x + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const pts = (n) => String(Math.round(n * 100) / 100);
  const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.round(s) % 60).padStart(2, "0");
  const range = fmtD(week[0]) + " – " + fmtD(week[6]);

  // ---- shared pieces ----
  const btn = (href, label, bg) => `<a href="${href}" style="display:inline-block;background:${bg || "#2E9BEA"};color:#ffffff;text-decoration:none;font-weight:800;font-size:17px;padding:14px 26px;border-radius:999px">${label}</a>`;
  const header = (sub) => `<tr><td align="center" style="background:linear-gradient(135deg,#45B8ED,#2F7FD6);background-color:#3A9BE3;padding:26px 20px 22px;color:#ffffff">
<div style="font-size:14px;font-weight:800;letter-spacing:1px;opacity:.9">LEARN WITH NINI · WEEKLY REPORT</div>
<div style="font-size:46px;line-height:1.2;margin:10px 0 4px">${esc(icon)}</div>
<div style="font-size:26px;font-weight:800">${esc(name)}</div>
<div style="font-size:14px;opacity:.95;margin-top:4px">${sub}</div></td></tr>`;
  const caseBox = cs ? `<tr><td style="padding:14px 20px 4px"><div style="background:#2B2350;border-radius:18px;padding:18px 16px;color:#ffffff;text-align:left">
<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#FFD24A">🕵️ NINI'S CASE FILES · CASE #${esc(cs.num)}${cs.isNew ? " · NEW TOMORROW" : ""}</div>
<div style="font-size:20px;font-weight:800;margin:6px 0 6px">${esc(cs.title)}</div>
<div style="font-size:15px;line-height:1.5;color:#E5E0FF">${esc(cs.teaser)}</div>
<div style="margin-top:14px">${btn(SITE + "/case-files.html", cs.isNew ? "Solve it Monday →" : "Solve the case →", "#F5A524")}</div>
${cs.nextLabel ? `<div style="font-size:12px;color:#BDB5E8;margin-top:10px">${esc(cs.nextLabel)}</div>` : ""}</div></td></tr>` : "";
  const footer = `<tr><td style="padding:16px 24px 24px;font-size:12px;line-height:1.6;color:#7C92AA" align="center">
Made from the progress saved to your Learn With Nini parent account${gRows.length ? " and " + esc(first) + "’s leaderboard scores" : ""}. Sign in on each device ${esc(first)} uses so nothing is missed.<br>
<a href="${opts.unsubUrl}" style="color:#4C86C6">Stop weekly reports</a> · <a href="${SITE}/account.html" style="color:#4C86C6">Account settings</a> · <a href="${SITE}/privacy.html" style="color:#4C86C6">Privacy</a>
</td></tr>`;
  const wrap = (rows, preheader) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Weekly report</title></head>
<body style="margin:0;padding:0;background:#E6F2FC;font-family:Helvetica,Arial,sans-serif;color:#203D61">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E6F2FC"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden">
${rows}
</table></td></tr></table></body></html>`;

  // ---- a quiet week: short and friendly, one easy way back in ----
  if (W.active === 0) {
    const html = wrap(`${header(range)}
<tr><td style="padding:24px 24px 6px" align="center">
<div style="font-size:22px;font-weight:800;color:#2F7FD6">We missed you this week! 🦭</div>
<div style="font-size:16px;line-height:1.55;color:#3c4566;margin:10px 0 18px">No practice this week, and that’s okay. A <b>3-minute Quick Dash</b> is the easiest way back in: just 8 questions, and it starts a new streak.</div>
${btn(SITE + "/daily-challenge.html", "Start a 3-minute Dash ⚡")}
</td></tr>
${caseBox}
${footer}`, `${name} didn’t practice this week. A 3-minute Quick Dash is an easy way back in.`);
    const text = `Learn With Nini weekly report: ${name} (${range})\n\nNo practice this week. A 3-minute Quick Dash is an easy way back in: ${SITE}/daily-challenge.html\n${cs ? `\nNini's Case Files #${cs.num}: ${cs.title}\n${SITE}/case-files.html\n` : ""}\nStop weekly reports: ${opts.unsubUrl}`;
    return { stats, subject: `${icon} ${name}: a 3-minute Dash is waiting`, html, text };
  }

  // ---- change vs last week: gray unless it's a real change ----
  const hadPrev = P.active > 0 || P.ss.length > 0;
  function delta(cur, old, unit, small) {
    if (!hadPrev || cur == null || old == null) return "";
    const n = cur - old;
    if (Math.abs(n) <= small) return `<div style="font-size:11px;color:#7C92AA;font-weight:700;margin-top:3px">about the same</div>`;
    return `<div style="font-size:11px;font-weight:800;margin-top:3px;color:${n > 0 ? "#1F9D55" : "#B4540F"}">${n > 0 ? "▲" : "▼"} ${Math.abs(n)}${unit}</div>`;
  }

  // ---- the week's highlight (headline + subject line) ----
  const bigBadge = newBadges.map((k) => BADGES[k]).filter(Boolean).find((b) => /Month|100 Days|1,000|Two Weeks|One Week|500/.test(b));
  let headline, subjectHi;
  if (streak >= 7) { headline = `🔥 ${streak}-day practice streak!`; subjectHi = `${streak}-day streak`; }
  else if (pb) { headline = `🎉 New personal best: ${pts(pb.pts)} points!`; subjectHi = "a new personal best"; }
  else if (W.active >= 5) { headline = "What a week! 🌟"; subjectHi = `${W.active} days of practice`; }
  else if (streak >= 3) { headline = `🔥 ${streak} days in a row!`; subjectHi = `${streak} days in a row`; }
  else if (W.active >= 3) { headline = "Great rhythm this week! 🌊"; subjectHi = `${W.active} days of practice`; }
  else { headline = "Nice start, let’s add a few more days! 🐬"; subjectHi = `${W.active} day${W.active > 1 ? "s" : ""} of practice`; }
  const extraHi = bigBadge ? bigBadge.replace(/^\S+\s/, "") + " badge" : pb && !/best/.test(subjectHi) ? "a new best score" : ranks.length ? `#${ranks[0].rank} on ${ranks[0].label}` : "";
  const subject = `${icon} ${name}: ${subjectHi}${extraHi ? " + " + extraHi : ""}!`;

  // ---- one plain sentence ----
  const bits = [`practiced <b>${W.active} day${W.active > 1 ? "s" : ""}</b>`];
  if (W.ss.length) bits.push(`finished <b>${W.ss.length} Daily Challenge${W.ss.length > 1 ? "s" : ""}</b>`);
  if (W.ds.length) bits.push(`did <b>${W.ds.length} Quick Dash${W.ds.length > 1 ? "es" : ""}</b>`);
  if (W.acc != null) bits.push(`got <b>${W.acc}%</b> right`);
  const summary = esc(first) + " " + (bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0]) + ".";

  const dayCells = week.map((x) => {
    const ok = activeOn(x);
    return `<td align="center" style="padding:0 3px"><div style="width:38px;height:38px;line-height:38px;border-radius:50%;font-size:18px;font-weight:800;${ok ? "background:#2E9BEA;color:#ffffff" : "background:#EAF3FC;color:#9BB3CC"}">${ok ? "✓" : "·"}</div><div style="font-size:12px;color:#5E7896;margin-top:4px;font-weight:700">${dow(x).slice(0, 2)}</div></td>`;
  }).join("");
  const tile = (big, small, extra) => `<td width="25%" align="center" valign="top" style="padding:5px"><div style="background:#F2F8FF;border-radius:16px;padding:13px 3px"><div style="font-size:23px;font-weight:800;color:#1E5FA8">${big}</div><div style="font-size:12px;color:#5E7896;font-weight:700;margin-top:2px;line-height:1.25">${small}</div>${extra || ""}</div></td>`;
  const row = (label, val) => `<tr><td style="padding:8px 10px 8px 0;border-bottom:1px solid #EDF3FA;color:#5E7896;font-size:15px;white-space:nowrap;vertical-align:top">${label}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #EDF3FA;color:#203D61;font-size:15px;font-weight:700">${val}</td></tr>`;

  // ---- wins: personal best, Quick Dash, leaderboard spots, badges ----
  const wins = [];
  if (pb) wins.push(`🎉 <b>New personal best:</b> ${pts(pb.pts)} points on the ${pb.mins}-minute Daily Challenge (${dow(pb.date)})`);
  if (dash) wins.push(`⚡ <b>Best Quick Dash:</b> ${pts(dash.score)} of 8 points${dash.secs ? " in " + mmss(dash.secs) : ""}`);
  for (const r of ranks) wins.push(`🏆 <b>#${r.rank}</b> on the ${esc(r.label)} leaderboard`);
  for (const k of newBadges) if (BADGES[k]) wins.push(`<b>${esc(BADGES[k])}</b> badge earned`);
  const winsBox = wins.length ? `<tr><td style="padding:14px 20px 4px"><div style="background:#FFF4E5;border-radius:18px;padding:14px 16px;text-align:left">
<div style="font-size:16px;font-weight:800;color:#9A4A00;margin-bottom:6px">This week’s wins</div>
${wins.map((w) => `<div style="font-size:15px;line-height:1.45;color:#5A3A12;padding:4px 0">${w}</div>`).join("")}</div></td></tr>` : "";

  // ---- skills ----
  const skillBox = skills.strong.length || skills.practice.length ? `<tr><td style="padding:14px 20px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" valign="top" style="padding-right:5px"><div style="background:#EEF9F3;border-radius:16px;padding:13px 12px;min-height:70px">
<div style="font-size:13px;font-weight:800;color:#17643A">💪 STRONG</div>
${skills.strong.length ? skills.strong.map((s) => `<div style="font-size:15px;font-weight:700;color:#1F4D33;margin-top:5px">${TOPICS[s.k].name} <span style="color:#3E8A5E;font-weight:800">${s.acc}%</span></div>`).join("") : `<div style="font-size:14px;color:#3E6B50;margin-top:5px">Keep practicing to find out!</div>`}
</div></td>
<td width="50%" valign="top" style="padding-left:5px"><div style="background:#FFF1F0;border-radius:16px;padding:13px 12px;min-height:70px">
<div style="font-size:13px;font-weight:800;color:#A3341F">🎯 PRACTICE</div>
${skills.practice.length ? skills.practice.map((s) => `<div style="font-size:15px;font-weight:700;color:#6B2A1C;margin-top:5px">${TOPICS[s.k].name} <span style="color:#B4540F;font-weight:800">${s.acc}%</span></div>`).join("") : `<div style="font-size:14px;color:#7A4A3E;margin-top:5px">Nothing tricky this week! 🎉</div>`}
</div></td></tr></table>
<div style="font-size:12px;color:#7C92AA;margin-top:6px;text-align:center">From Daily Challenge and Quick Dash answers this week</div></td></tr>` : "";

  // ---- what to do next (one box, one button) ----
  const practiceTopic = skills.practice[0];
  const mostlyTen = W.ss.length && W.ss.every((s) => s.mins === 10);
  let nextText, nextBtn;
  if (practiceTopic) {
    nextText = `A few rounds of <b>${TOPICS[practiceTopic.k].name.toLowerCase()}</b> would help most.`;
    nextBtn = btn(SITE + "/" + TOPICS[practiceTopic.k].url, "Practice " + TOPICS[practiceTopic.k].name.toLowerCase() + " →");
  } else if (streak >= 7 && mostlyTen) {
    nextText = `${esc(first)} is ready for more. Try the <b>15-minute Daily Challenge</b> this week.`;
    nextBtn = btn(SITE + "/daily-challenge.html", "Try 15 minutes →");
  } else if (streak >= 7 && W.best) {
    nextText = `Can ${esc(first)} beat <b>${pts(W.best.pts)} points</b> on the ${W.best.mins}-minute Daily Challenge?`;
    nextBtn = btn(SITE + "/daily-challenge.html", "Go for a new best →");
  } else if (path.next) {
    nextText = `Keep the adventure going with <b>${esc(path.next.text)}</b>.`;
    nextBtn = btn(SITE + "/" + path.next.url, "Play next level →");
  } else {
    nextText = "Every adventure level is done! Try for a new best on the Daily Challenge.";
    nextBtn = btn(SITE + "/daily-challenge.html", "Daily Challenge →");
  }
  const pathPct = Math.round(path.done / path.total * 100);
  const nextBox = `<tr><td style="padding:14px 20px 4px"><div style="background:#FFF8E1;border-radius:18px;padding:18px 16px;text-align:center">
<div style="font-size:16px;line-height:1.5;color:#5A4500">🎯 <b>Nini suggests:</b> ${nextText}</div>
<div style="margin:14px 0 14px">${nextBtn}</div>
<div style="font-size:13px;color:#7A6420;font-weight:700">🗺️ Adventure Path: ${path.done} of ${path.total} levels · ${path.stamps} of 6 stamps</div>
<div style="background:#F3E3B0;border-radius:999px;height:8px;margin:7px auto 0;max-width:300px;overflow:hidden"><div style="background:#E0A800;height:8px;width:${Math.max(3, pathPct)}%;border-radius:999px"></div></div>
</div></td></tr>`;

  // ---- a note from Nini to read to the child, with one goal ----
  let shout, goal;
  if (pb) shout = `you set a new personal best of ${pts(pb.pts)} points!`;
  else if (streak >= 7) shout = `you’ve practiced ${streak} days in a row. That’s amazing!`;
  else if (ranks.length) shout = `you’re #${ranks[0].rank} on the ${ranks[0].label} leaderboard!`;
  else if (skills.strong.length) shout = `you got ${skills.strong[0].acc}% right in ${TOPICS[skills.strong[0].k].name.toLowerCase()}!`;
  else if (W.active >= 3) shout = `you practiced ${W.active} days this week!`;
  else shout = "thanks for doing math with me this week!";
  if (W.active < 3) goal = "practice 3 days next week. Even a 3-minute Dash counts!";
  else if (practiceTopic) goal = `practice ${TOPICS[practiceTopic.k].name.toLowerCase()} and try to get even more right.`;
  else if (streak >= 7) goal = `keep your streak going all the way to ${streak + 7} days!`;
  else if (W.best) goal = `beat your best of ${pts(W.best.pts)} points on the Daily Challenge.`;
  else goal = "try a full Daily Challenge with me!";
  const noteBox = `<tr><td style="padding:14px 20px 4px"><div style="background:#F3F0FF;border:2px dashed #B9AEF5;border-radius:18px;padding:16px;text-align:left">
<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#6B5BD6">📣 READ THIS TO ${esc(first).toUpperCase()}</div>
<div style="font-size:17px;line-height:1.55;color:#2E2560;margin-top:8px">“Hi ${esc(first)}! ${esc(shout.charAt(0).toUpperCase() + shout.slice(1))} Your goal for next week: ${esc(goal)} See you on the leaderboard! 🦭”<br><span style="font-size:14px;color:#6B5BD6;font-weight:800">— Nini</span></div></div></td></tr>`;

  const rows = `${header(range + (grade ? " · Grade " + esc(grade) : ""))}
<tr><td style="padding:20px 22px 4px"><div style="background:#F2F8FF;border-left:5px solid #2E9BEA;border-radius:12px;padding:14px 16px;font-size:16px;line-height:1.5;color:#203D61">${summary}</div></td></tr>
<tr><td style="padding:18px 20px 6px" align="center">
<div style="font-size:23px;font-weight:800;color:${streak >= 3 ? "#C2410C" : "#2F7FD6"};margin-bottom:12px">${headline}</div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${dayCells}</tr></table>
</td></tr>
<tr><td style="padding:14px 14px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${tile(W.active + "/7", "days practiced", delta(W.active, P.active, " days", 0))}${tile(W.mins, "minutes of practice", delta(W.mins, P.mins, " min", Math.max(10, Math.round(P.mins * 0.15))))}${tile(W.acc == null ? "–" : W.acc + "%", "answers right", delta(W.acc, P.acc, "%", 3))}${tile(W.xp, "game points earned", P.xp > 0 ? delta(W.xp, P.xp, "", Math.max(20, Math.round(P.xp * 0.15))) : "")}
</tr></table></td></tr>
${winsBox}
${skillBox}
<tr><td style="padding:10px 24px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Daily Challenges", W.ss.length ? W.ss.length + (W.best ? ` · best ${pts(W.best.pts)} points (${W.best.mins} min, ${dow(W.best.date)})` : "") : "–")}
${W.ds.length ? row("Quick Dashes", String(W.ds.length)) : ""}
${row("Favorite games", played.length ? played.slice(0, 3).map((k) => GAMES[k]).join(", ") : "–")}
</table></td></tr>
${noteBox}
${nextBox}
${caseBox}
${footer}`;
  const html = wrap(rows, summary.replace(/<[^>]+>/g, ""));
  const text = `Learn With Nini weekly report: ${name} (${range})\n\n${summary.replace(/<[^>]+>/g, "")}\n${headline}\n\nDays practiced: ${W.active}/7\nMinutes: ${W.mins}\nAnswers right: ${W.acc == null ? "-" : W.acc + "%"}\nStreak: ${streak} days\n${wins.length ? "\nThis week's wins:\n" + wins.map((w) => "- " + w.replace(/<[^>]+>/g, "")).join("\n") + "\n" : ""}${skills.strong.length ? "\nStrong: " + skills.strong.map((s) => TOPICS[s.k].name + " " + s.acc + "%").join(", ") : ""}${skills.practice.length ? "\nPractice: " + skills.practice.map((s) => TOPICS[s.k].name + " " + s.acc + "%").join(", ") : ""}\n\nFrom Nini to ${name}: Hi ${name}! ${shout.charAt(0).toUpperCase() + shout.slice(1)} Your goal for next week: ${goal}\n\nNini suggests: ${nextText.replace(/<[^>]+>/g, "")}\nAdventure Path: ${path.done}/${path.total} levels, ${path.stamps}/6 stamps\n${cs ? `\nNini's Case Files #${cs.num}: ${cs.title}\n${cs.teaser}\n${SITE}/case-files.html\n` : ""}\nPlay: ${SITE}\n\nStop weekly reports: ${opts.unsubUrl}`;
  return { stats, subject, html, text };
}
// ---- the function ----
import { createClient } from "npm:@supabase/supabase-js@2";
const FN_URL = "https://wvcdihtphcjuegdkadsb.supabase.co/functions/v1/weekly-report";
const TEST_TO = "sunlapse@hotmail.com";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
async function sign(uid) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("lwn-unsub:" + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uid)));
  return Array.from(sig.slice(0, 16)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
async function allUsers() {
  const out = [];
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    out.push(...data.users);
    if (data.users.length < 200) break;
  }
  return out;
}
// This week's Case File, read from the live Case Files page (no spoilers: title + the opening lines only)
async function caseInfo(now) {
  try {
    const page = await (await fetch(SITE + "/case-files.html", { headers: { "cache-control": "no-cache" } })).text();
    const re = /num:\s*(\d+),\s*live:\s*"(\d{4}-\d{2}-\d{2})",\s*title:\s*"([^"]+)",\s*(?:next:\s*"([^"]*)",\s*)?intro:\s*"([^"]+)"/g;
    const cases = []; let m;
    while ((m = re.exec(page))) cases.push({ num: m[1], live: m[2], title: m[3], next: m[4] || "", intro: m[5] });
    if (!cases.length) return null;
    const today = hiDay(0, now);
    let monday = shiftDay(today, 1); while (new Date(monday + "T12:00:00Z").getUTCDay() !== 1) monday = shiftDay(monday, 1);
    const pick = cases.find((c) => c.live === monday) || cases.filter((c) => c.live <= today).sort((a, b) => a.live < b.live ? 1 : -1)[0];
    if (!pick) return null;
    const plain = pick.intro.replace(/<[^>]+>/g, "").replace(/\\n/g, " ").replace(/^Detective, we have a new case!\s*\S*\s*/i, "").trim();
    const sentences = plain.match(/[^.!?]+[.!?]+/g) || [plain];
    let teaser = ""; for (const s of sentences) { if ((teaser + s).length > 190 && teaser) break; teaser += s; }
    return { num: pick.num, title: pick.title, teaser: teaser.trim(), isNew: pick.live === monday, nextLabel: pick.live === monday ? "" : pick.next };
  } catch (_) { return null; }
}
// All leaderboard rows once per run: used for each child's rank and best Quick Dash
async function boards() {
  const { data } = await admin.from("game_scores").select("player_key, game, score, level").limit(5000);
  const by = {};
  for (const r of data || []) {
    const g = by[r.game] || (by[r.game] = {});
    const prev = g[r.player_key];
    if (!prev || Number(r.score) > Number(prev.score)) g[r.player_key] = r;
  }
  return by;
}
const BOARD_LABEL = { ...GAMES, daily_challenge: "Daily Challenge", quick_dash: "Quick Dash" };
function ranksFor(by, key) {
  const out = [];
  for (const game of Object.keys(by)) {
    const rows = Object.values(by[game]);
    if (rows.length < 3 || !by[game][key]) continue;
    const secs = (r) => Number(String(r.level || "").split("|")[2]) || 99999;
    rows.sort((a, b) => Number(b.score) - Number(a.score) || (game === "quick_dash" ? secs(a) - secs(b) : 0));
    const rank = rows.findIndex((r) => r.player_key === key) + 1;
    if (rank >= 1 && rank <= 10) out.push({ label: BOARD_LABEL[game] || game, rank });
  }
  return out.sort((a, b) => a.rank - b.rank);
}
async function sendOne(user, to, now, ctx) {
  const { data: row } = await admin.from("player_progress").select("data").eq("user_id", user.id).maybeSingle();
  const s = await sign(user.id);
  const unsubPage = `https://learnwithnini.com/unsubscribe.html?u=${user.id}&s=${s}`;
  const data = row && row.data || {};
  const prof = J(data["learningWithNiniProfileV1"], {}) || {};
  const nick = String(prof.name || data["niniPlayerName"] || "").trim();
  const key = nick.toLocaleLowerCase("en-US");
  let globalRows = [], ranks = [], dash = null;
  if (nick && key !== "nini") {
    const { data: g } = await admin.from("daily_challenge_scores").select("challenge_date, minutes, mode, grade, score").eq("player_name", nick).order("challenge_date", { ascending: false }).limit(400);
    globalRows = g || [];
    ranks = ranksFor(ctx.boards, key);
    const d = ctx.boards.quick_dash && ctx.boards.quick_dash[key];
    if (d) dash = { score: Number(d.score) || 0, secs: Number(String(d.level || "").split("|")[2]) || 0 };
  }
  const r = buildReport(data, { now, unsubUrl: unsubPage, globalRows, ranks, dash, caseInfo: ctx.caseInfo });
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": Deno.env.get("BREVO_API_KEY"), "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Learn With Nini", email: "hello@learnwithnini.com" },
      replyTo: { email: "hello@learnwithnini.com" },
      to: [{ email: to }],
      subject: r.subject,
      htmlContent: r.html,
      textContent: r.text,
      headers: {
        "List-Unsubscribe": `<${FN_URL}?u=${user.id}&s=${s}>, <mailto:hello@learnwithnini.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      },
      tags: ["weekly-report"]
    })
  });
  return { to, ok: res.ok, status: res.status, body: res.ok ? undefined : (await res.text()).slice(0, 300), stats: r.stats, subject: r.subject };
}
async function context(now) {
  const [b, c] = await Promise.all([boards().catch(() => ({})), caseInfo(now)]);
  return { boards: b, caseInfo: c };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  let body = {};
  try { body = await req.json(); } catch (_) {}
  const uid = body.u || url.searchParams.get("u"), sig = body.s || url.searchParams.get("s");
  // 1) one-tap unsubscribe (from the email link page or the mail app's unsubscribe button)
  if (uid && sig) {
    if (sig !== await sign(uid)) return json({ ok: false, error: "bad link" }, 400);
    const { data: u } = await admin.auth.admin.getUserById(uid);
    if (!u?.user) return json({ ok: false, error: "no account" }, 404);
    await admin.auth.admin.updateUserById(uid, { user_metadata: { ...u.user.user_metadata || {}, weekly_report: false } });
    return json({ ok: true });
  }
  const now = Date.now();
  // 2) test: only ever sends to Dustin's address
  if (body.action === "test") {
    const users = await allUsers();
    const me = users.find((x) => (x.email || "").toLowerCase() === TEST_TO);
    if (!me) return json({ ok: false, error: "test account missing" }, 404);
    const ctx = await context(now);
    return json({ ok: true, case: ctx.caseInfo, results: [await sendOne(me, TEST_TO, now, ctx)] });
  }
  // 3) the weekly send: only on Sunday evening Hawaii time, and only once per week
  if (body.action === "send") {
    const hi = new Date(now - 10 * 3600e3);
    if (hi.getUTCDay() !== 0 || hi.getUTCHours() < 16) return json({ ok: false, error: "not Sunday evening in Hawaii" }, 409);
    const weekKey = hi.toISOString().slice(0, 10);
    const { error: lockErr } = await admin.from("report_runs").insert({ week: weekKey });
    if (lockErr) return json({ ok: false, error: "already sent this week" }, 409);
    const users = (await allUsers()).filter((x) => x.email && x.email_confirmed_at && x.user_metadata?.weekly_report !== false);
    const ctx = await context(now);
    const results = [];
    for (const u of users) {
      try { results.push(await sendOne(u, u.email, now, ctx)); }
      catch (e) { results.push({ to: u.email, ok: false, body: String(e) }); }
    }
    await admin.from("report_runs").update({ sent: results.filter((r) => r.ok).length, detail: results.map((r) => ({ ok: r.ok, status: r.status })) }).eq("week", weekKey);
    return json({ ok: true, sent: results.filter((r) => r.ok).length, total: results.length });
  }
  return json({ ok: false, error: "nothing to do" }, 400);
});
