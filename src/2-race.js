/* ===================================================================== race simulation (pure: no drawing, so it can be sim'd fast) */
function rating(c) { return c.spd * (1 - (1 - c.sta) * DATA.race.fadeMax * 0.45) + c.luck * 0.012 - c.greed * 0.01; }
function pips(v, lo, hi) { return clamp(Math.round(1 + 4 * (v - lo) / (hi - lo)), 1, 5); }
function newLineup() {
  const [a, b] = DATA.crowsPerRace, n = a + Math.floor(Math.random() * (b - a + 1));
  const crows = shuffle(DATA.roster).slice(0, n);
  const byR = crows.map((c, i) => [rating(c), i]).sort((x, y) => y[0] - x[0]);
  return { crows, fav: byR[0][1], dog: byR[byR.length - 1][1], rank: byR.reduce((m, [, i], k) => (m[i] = k, m), {}) };
}
function newRace(lineup) {
  const v0 = DATA.race.L / DATA.race.avgTime;
  return {
    t: 0, done: false, finish: [], nextEv: DATA.chaos.first + rand(-0.5, 1), events: [], banner: null, fx: [],
    crows: lineup.crows.map((c, i) => ({ i, c, d: 0, v: 0, v0: v0 * c.spd, ph: rand(0, 6.28), stop: 0, boost: 0, boostK: 1, back: 0, wind: 0, windK: 1, time: 0, place: 0 }))
  };
}
function order(R) { return R.crows.slice().sort((a, b) => (a.place || 99) - (b.place || 99) || b.d - a.d); }
const CHAOS = {
  wind(R) {
    const live = order(R).filter(k => !k.place); if (live.length < 2) return null;
    const half = Math.ceil(live.length / 2);
    live.forEach((k, j) => { k.wind = 2.6; k.windK = j >= live.length - half ? 1.38 : 0.86; });
    return { title: 'WIND GUST!', sub: 'A tailwind shoves the back of the pack forward!' };
  },
  shiny(R) {
    const live = R.crows.filter(k => !k.place && !k.stop); if (!live.length) return null;
    const k = weighted(live, x => 0.15 + x.c.greed * 1.6);
    k.stop = 1.1 + k.c.greed * 1.9; R.fx.push({ type: 'shiny', i: k.i, t0: R.t, dur: k.stop });
    return { title: 'OOH, SHINY!', sub: k.c.name + ' stops to grab something sparkly!', i: k.i };
  },
  hawk(R) {
    const live = order(R).filter(k => !k.place); if (!live.length) return null;
    const k = Math.random() < 0.6 ? live[0] : pick(live.slice(0, Math.min(3, live.length)));
    R.fx.push({ type: 'hawk', i: k.i, t0: R.t });
    if (Math.random() < k.c.luck * 0.45) return { title: 'HAWK SWOOP!', sub: k.c.name + ' dodges the hawk at the last second!', i: k.i };
    k.back = k.c.grit ? 0.6 : 1.3; k.boost = 0; k.stop = 0;
    return { title: 'HAWK SWOOP!', sub: k.c.name + (k.c.grit ? ' gets bumped, and is NOT happy about it!' : ' gets knocked way off course!'), i: k.i };
  },
  worm(R) {
    const live = R.crows.filter(k => !k.place); if (!live.length) return null;
    const k = weighted(live, x => 0.3 + x.c.luck);
    k.boost = 2.6; k.boostK = 1.6; R.fx.push({ type: 'worm', i: k.i, t0: R.t });
    return { title: 'WORM SNACK!', sub: k.c.name + ' finds a worm and gets a sugar rush!', i: k.i };
  },
  updraft(R) {
    const live = order(R).filter(k => !k.place); if (live.length < 2) return null;
    const k = live[live.length - 1];
    k.boost = 3.2; k.boostK = 1.85; R.fx.push({ type: 'updraft', i: k.i, t0: R.t });
    return { title: 'LUCKY UPDRAFT!', sub: 'Last place ' + k.c.name + ' catches a thermal and rockets forward!', i: k.i };
  }
};
function stepRace(R, dt) {
  const D = DATA.race, L = D.L; R.t += dt;
  let lead = 0;
  for (const k of R.crows) {
    if (k.place) { k.d += k.v0 * 0.5 * dt; continue; }   // coasting past the line
    const p = k.d / L;
    let v = k.v0 * (1 + D.wobble * Math.sin(k.ph + R.t * 0.9) + 0.02 * Math.sin(k.ph * 3 + R.t * 2.3));
    if (p > D.fadeFrom) v *= 1 - (1 - k.c.sta) * D.fadeMax * (p - D.fadeFrom) / (1 - D.fadeFrom);
    if (k.wind > 0) { k.wind -= dt; v *= k.windK; }
    if (k.boost > 0) { k.boost -= dt; v *= k.boostK; }
    if (k.back > 0) { k.back -= dt; v = -0.45 * k.v0; }
    else if (k.stop > 0) { k.stop -= dt; v = 0; }
    k.v = v; k.d = Math.max(0, k.d + v * dt);
    if (k.d >= L) { k.place = R.finish.length + 1; k.time = R.t; R.finish.push(k.i); }
    lead = Math.max(lead, k.d);
  }
  if (R.banner && R.t - R.banner.t0 > DATA.chaos.banner) R.banner = null;
  R.nextEv -= dt;
  if (R.nextEv <= 0 && lead > L * 0.08 && lead < L * 0.88) {
    const type = weighted(Object.keys(DATA.chaos.weights), k => DATA.chaos.weights[k]);
    const ev = CHAOS[type](R);
    if (ev) { ev.type = type; ev.t0 = R.t; R.banner = ev; R.events.push(ev); }
    R.nextEv = rand(DATA.chaos.gap[0], DATA.chaos.gap[1]);
  }
  R.fx = R.fx.filter(f => R.t - f.t0 < 3.5);
  if (R.finish.length === R.crows.length) R.done = true;
}
/* fast headless simulation for balance checks: n random races, win counts per crow */
function simulate(n) {
  const out = { races: n, wins: {}, entered: {}, favWins: 0, dogWins: 0, upsets: 0, avgTime: 0, events: {} };
  for (let r = 0; r < n; r++) {
    const lu = newLineup(), R = newRace(lu);
    while (!R.done && R.t < 80) stepRace(R, 1 / 30);
    const w = R.finish[0]; lu.crows.forEach(c => out.entered[c.name] = (out.entered[c.name] || 0) + 1);
    out.wins[lu.crows[w].name] = (out.wins[lu.crows[w].name] || 0) + 1;
    if (w === lu.fav) out.favWins++; if (w === lu.dog) out.dogWins++; if (lu.rank[w] >= 2) out.upsets++;
    out.avgTime += R.crows[w].time / n; for (const e of R.events) out.events[e.type] = (out.events[e.type] || 0) + 1;
  }
  return out;
}

/* ===================================================================== leaderboard (stream-long, saved on this PC) */
const BKEY = 'crowrace.board.v1';
let board = (() => { try { return JSON.parse(localStorage.getItem(BKEY)) || {}; } catch (e) { return {}; } })();
function saveBoard() { try { localStorage.setItem(BKEY, JSON.stringify(board)); } catch (e) {} }
function topBoard(n) { return Object.entries(board).filter(([, s]) => s.pts > 0).map(([u, s]) => Object.assign({ u }, s)).sort((a, b) => b.pts - a.pts || b.streak - a.streak || a.t - b.t).slice(0, n || DATA.boardSize); }
function resetBoard() { board = {}; saveBoard(); }

/* ===================================================================== the show: title -> lineup -> betting -> race -> results -> lineup ... */
const G = { phase: 'title', t: DATA.phase.title, raceNo: 0, lineup: null, picks: new Map(), feed: [], R: null, result: null, paused: false, anim: 0 };
function backers(i) { let n = 0; for (const p of G.picks.values()) if (p.i === i) n++; return n; }
function setPhase(ph) {
  G.phase = ph;
  if (ph === 'lineup') { G.raceNo++; G.lineup = newLineup(); G.picks = new Map(); G.feed = []; G.R = null; G.result = null; G.t = DATA.phase.lineup; BOT.plan(); }
  else if (ph === 'betting') G.t = DATA.phase.betting;
  else if (ph === 'race') { G.R = newRace(G.lineup); G.t = DATA.phase.raceCap; G.after = DATA.phase.afterFinish; }
  else if (ph === 'results') { finishRace(); G.t = DATA.phase.results; }
}
function finishRace() {
  const R = G.R, lu = G.lineup;
  if (!R.done) for (const k of order(R)) if (!k.place) { k.place = R.finish.length + 1; R.finish.push(k.i); }   // time cap: rank by distance
  const w = R.finish[0], winners = [], now = Date.now();
  for (const [u, p] of G.picks) {
    const s = board[u] || (board[u] = { pts: 0, streak: 0, best: 0, t: now });
    if (p.bot) s.bot = true;
    if (p.i === w) { s.pts++; s.streak++; s.best = Math.max(s.best, s.streak); s.t = now; winners.push({ u, streak: s.streak }); }
    else s.streak = 0;
  }
  saveBoard();
  winners.sort((a, b) => b.streak - a.streak);
  G.result = { w, winners, picked: G.picks.size, upset: lu.rank[w] >= 2, dog: w === lu.dog, fav: w === lu.fav };
}
function update(dt) {
  if (G.paused) return;
  G.anim += dt; BOT.tick(dt);
  if (G.phase === 'race') {
    stepRace(G.R, dt); G.t -= dt;
    if (G.R.done) G.after -= dt;
    if ((G.R.done && G.after <= 0) || G.t <= 0) setPhase('results');
    return;
  }
  G.t -= dt;
  if (G.t <= 0) setPhase({ title: 'lineup', lineup: 'betting', betting: 'race', results: 'lineup' }[G.phase]);
}
function skipPhase() { if (G.phase === 'race') { while (!G.R.done && G.R.t < 80) stepRace(G.R, 1 / 30); setPhase('results'); } else G.t = 0.001; }

/* ===================================================================== chat: "!crow N" during betting. ONE pick per chatter per race; the LATEST pick counts. */
function onChat(user, text, src) {
  if (!user || text == null) return false;
  if (src === 'bot' && settings.testMode !== 'on') return false;
  const m = /^\s*!crow\s*#?(\d+)\b/i.exec(String(text));
  if (!m || G.phase !== 'betting' || !G.lineup) return false;
  const n = +m[1]; if (n < 1 || n > G.lineup.crows.length) return false;
  const key = String(user), prev = G.picks.get(key);
  if (prev && prev.i === n - 1) return true;
  G.picks.delete(key); G.picks.set(key, { i: n - 1, bot: src === 'bot' });   // re-insert so the feed order stays recent
  G.feed.unshift({ u: key, n, sw: !!prev }); if (G.feed.length > 8) G.feed.length = 8;
  return true;
}

/* ===================================================================== Test mode: fake chatters (only when Test mode is On) */
const BOT = {
  todo: [],
  plan() {   // each bot decides when (and whether) to pick in this race; some switch later
    this.todo = [];
    if (settings.testMode !== 'on' || !G.lineup) return;
    const n = G.lineup.crows.length;
    for (const u of DATA.bots.names) {
      if (Math.random() < 0.15) continue;
      const first = Math.random() < 0.3 ? G.lineup.fav : Math.floor(Math.random() * n);
      this.todo.push({ u, at: rand(1, DATA.phase.betting - 3), msg: '!crow ' + (first + 1) });
      if (Math.random() < 0.2) this.todo.push({ u, at: rand(15, DATA.phase.betting - 1), msg: '!crow ' + (1 + Math.floor(Math.random() * n)) });
    }
  },
  tick() {
    if (settings.testMode !== 'on') { this.todo = []; return; }
    if (G.phase !== 'betting') return;
    const el = DATA.phase.betting - G.t;
    this.todo = this.todo.filter(b => { if (el >= b.at) { onChat(b.u, b.msg, 'bot'); return false; } return true; });
  },
  purge() {   // Test mode turned off: remove every trace of the bots
    this.todo = [];
    for (const [u, p] of [...G.picks]) if (p.bot) G.picks.delete(u);
    G.feed = G.feed.filter(f => G.picks.has(f.u));
    for (const u in board) if (board[u].bot) delete board[u];
    saveBoard();
  }
};
