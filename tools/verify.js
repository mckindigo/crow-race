// Headless verification (puppeteer-core + Chrome, same setup as Chat Clash's tools):
// full Test-mode loop, stubbed Kick socket counting !crow picks, upset/win distribution over many races,
// leaderboard updates + reset + persistence, pause, Test mode fully off, both themes (neutral: no "Croww" text but the credit),
// zero console errors. Screenshots -> shots/.
const puppeteer = require('puppeteer-core'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'shots'); fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, u === '/' ? 'index.html' : u), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': 'text/html' }); r.end(d); } }); }).listen(0);
let URL0 = '';
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
const CREDIT = 'made by Croww \u00b7 kick.com/croww';
const errors = [];
// fake Kick/Pusher socket: answers the handshake, records subscriptions, lets the test push chat messages
const STUB = () => {
  window.__subs = []; window.__socks = [];
  window.WebSocket = class { constructor(url) { this.url = url; this.readyState = 0; window.__socks.push(this); setTimeout(() => { this.readyState = 1; this.onmessage && this.onmessage({ data: JSON.stringify({ event: 'pusher:connection_established', data: '{}' }) }); }, 10); }
    send(s) { const m = JSON.parse(s); if (m.event === 'pusher:subscribe') { window.__subs.push(m.data.channel); setTimeout(() => this.onmessage({ data: JSON.stringify({ event: 'pusher_internal:subscription_succeeded', channel: m.data.channel }) }), 10); } }
    close() { this.readyState = 3; } };
  window.__kickPush = (user, content, badges) => { for (const s of window.__socks) if (s.readyState === 1) s.onmessage({ data: JSON.stringify({ event: 'App\\Events\\ChatMessageEvent', data: JSON.stringify({ content, sender: { username: user, identity: { badges: badges || [] } } }) }) }); };
  let a = 777; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  window.__texts = []; const P = CanvasRenderingContext2D.prototype; for (const k of ['fillText', 'strokeText']) { const f = P[k]; P[k] = function (s, ...r) { window.__texts.push(String(s)); return f.call(this, s, ...r); }; }
};
async function open(browser, q, clear) {
  const page = await browser.newPage(); await page.evaluateOnNewDocument(STUB);
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(URL0 + (q || '')); if (clear) { await page.evaluate(() => localStorage.clear()); await page.goto(URL0 + (q || '')); }
  await page.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => CR.manual(true));
  return page;
}
const shot = async (page, name) => { const d = await page.evaluate(() => { CR.render(); return document.getElementById('c').toDataURL('image/png'); }); const f = path.join(out, name + '.png'); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); return f; };

(async () => {
  await new Promise(r => srv.listening ? r() : srv.once('listening', r)); URL0 = 'http://localhost:' + srv.address().port + '/';
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  // ---------- 1. full loop in Test mode (croww theme) + screenshots
  let p = await open(browser, '?test=1&theme=croww', true);
  let s = await p.evaluate(() => ({ ph: CR.G.phase, sub: window.__subs.slice(), st: CR.Kick.status }));
  ok(s.ph === 'title', 'starts on the title screen');
  ok(s.sub[0] === 'chatrooms.962037.v2' && s.st === 'live', 'auto-connects to Croww chatroom 962037 by default (' + s.sub[0] + ', ' + s.st + ')');
  await p.evaluate(() => window.__texts = []); await shot(p, 'title-croww');
  ok(await p.evaluate(c => window.__texts.includes(c), CREDIT), 'title shows the credit line (croww theme)');
  await p.evaluate(() => CR.step(5.1)); ok(await p.evaluate(() => CR.G.phase) === 'lineup', 'title -> lineup on its own');
  await p.evaluate(() => CR.step(7.1)); ok(await p.evaluate(() => CR.G.phase) === 'betting', 'lineup -> betting on its own');
  await p.evaluate(() => CR.step(24));
  s = await p.evaluate(() => ({ n: CR.G.lineup.crows.length, picks: CR.G.picks.size, t: CR.G.t }));
  ok(s.n >= 4 && s.n <= 6, 'lineup has ' + s.n + ' crows (4-6)'); ok(s.picks > 5, 'test bots placed ' + s.picks + ' picks');
  console.log('  shot ' + await shot(p, 'betting'));
  await p.evaluate(() => CR.step(6.1)); ok(await p.evaluate(() => CR.G.phase) === 'race', 'betting -> race after 30s');
  // step until a hawk swoop is mid-dive (fallback: any chaos banner)
  s = await p.evaluate(() => { let any = null; for (let i = 0; i < 900; i++) { CR.step(0.1); const R = CR.G.R; if (!R || CR.G.phase !== 'race') break; const b = R.banner; if (b && R.t - b.t0 > 0.5) { if (b.type === 'hawk') return { type: b.type, title: b.title, t: R.t }; if (!any) any = { type: b.type, title: b.title, t: R.t }; } } return any; });
  ok(!!s, 'a chaos event fired during the race: ' + (s && s.title));
  console.log('  shot ' + await shot(p, 'race-chaos'));
  const ev = await p.evaluate(() => { while (CR.G.phase === 'race') CR.step(0.1); return CR.G.R.events.map(e => e.type); });
  console.log('  events this race: ' + ev.join(', '));
  s = await p.evaluate(() => ({ ph: CR.G.phase, w: CR.G.result && CR.G.result.w, winners: CR.G.result && CR.G.result.winners.length, time: CR.G.R.crows[CR.G.result.w].time, board: CR.topBoard(3) }));
  ok(s.ph === 'results', 'race -> results on its own (winner finished in ' + (s.time || 0).toFixed(1) + 's)');
  ok(s.time > 24 && s.time < 36, 'race lasts about 30s');
  ok(s.winners === 0 || s.board[0].pts === 1, 'leaderboard updated: ' + s.winners + ' correct pickers got +1');
  console.log('  shot ' + await shot(p, 'results'));
  // play several more races to see streaks build and the loop keep going
  s = await p.evaluate(() => { for (let i = 0; i < 6 * 120; i++) CR.step(1); return { race: CR.G.raceNo, ph: CR.G.phase, top: CR.topBoard(3) }; });
  ok(s.race >= 8, 'auto-loop keeps running with no clicks (now race #' + s.race + ')');
  ok(s.top.length && s.top[0].pts >= 2, 'leaderboard accumulates across races: ' + s.top.map(r => r.u + ' ' + r.pts + 'pts best streak ' + r.best).join(' | '));
  await p.evaluate(() => { while (CR.G.phase !== 'results') CR.step(0.5); });
  await shot(p, 'results-later-croww');
  // pause
  s = await p.evaluate(() => { CR.setPaused(true); const t = CR.G.t; CR.step(5); const t2 = CR.G.t; CR.render(); CR.setPaused(false); return [t, t2]; });
  ok(s[0] === s[1], 'pause freezes the loop');
  await p.keyboard.press('p'); ok(await p.evaluate(() => CR.G.paused), 'P key pauses'); await p.keyboard.press('p');
  // persistence across reload
  const before = await p.evaluate(() => JSON.stringify(CR.topBoard(10)));
  await p.reload(); await p.evaluate(() => CR.manual(true));
  ok(await p.evaluate(() => JSON.stringify(CR.topBoard(10))) === before, 'leaderboard survives a reload (localStorage)');
  // Test mode off: bots gone everywhere
  s = await p.evaluate(() => { CR.setTestMode(false); while (CR.G.phase !== 'betting') CR.step(0.5); CR.step(29); return { picks: CR.G.picks.size, board: Object.keys(CR.board).filter(u => CR.board[u].bot).length }; });
  ok(s.picks === 0 && s.board === 0, 'Test mode off: no bot picks during a full betting window, bot rows removed from the board');
  await p.close();

  // ---------- 2. stubbed Kick socket path counts !crow picks
  p = await open(browser, '?test=0', true);
  s = await p.evaluate(() => {
    CR.step(5.1); window.__kickPush('early', '!crow 1'); const early = CR.G.picks.size;   // lineup: betting not open yet
    CR.step(7.1);
    window.__kickPush('alice', '!crow 1'); window.__kickPush('bob', '!crow 2'); window.__kickPush('bob', '!crow 3');   // bob switches: latest counts
    window.__kickPush('carl', '!crow 99'); window.__kickPush('dana', 'hello chat'); window.__kickPush('eve', '!CROW2');
    window.__kickPush('subfan', '!crow 1', [{ type: 'subscriber', text: 'Subscriber' }]);   // subscriber badge: counted exactly like anyone else
    window.__kickPush('alice', '!crow 1');
    const b = CR.G.lineup.crows.map((c, i) => [...CR.G.picks.values()].filter(p => p.i === i).length);
    return { early, picks: CR.G.picks.size, b, bob: CR.G.picks.get('bob').i, msgs: CR.Kick.msgs, status: CR.Kick.status };
  });
  ok(s.status === 'live' && s.msgs === 9, 'stub socket delivered ' + s.msgs + ' chat messages through the real Kick reader');
  ok(s.early === 0, 'picks before betting opens are ignored');
  ok(s.picks === 4 && s.b[0] === 2 && s.b[1] === 1 && s.b[2] === 1 && s.bob === 2, 'backer counts ' + JSON.stringify(s.b) + ' (bob switched to #3, invalid/non-command ignored, one pick per chatter)');
  await p.close();

  // ---------- 3. many simulated races: win distribution + upsets
  p = await open(browser, '?test=0&connect=0', true);
  const sim = await p.evaluate(() => CR.simulate(5000));
  console.log('  ' + sim.races + ' simulated races, avg winning time ' + sim.avgTime.toFixed(1) + 's');
  const rows = Object.keys(sim.entered).map(k => [k, sim.wins[k] || 0, sim.entered[k]]).sort((a, b) => b[1] / b[2] - a[1] / a[2]);
  for (const [k, w, e] of rows) console.log('    ' + k.padEnd(13) + ' won ' + String(w).padStart(4) + ' / ' + e + ' races entered (' + (100 * w / e).toFixed(1) + '%)');
  console.log('  favorite won ' + (100 * sim.favWins / sim.races).toFixed(1) + '%, underdog won ' + (100 * sim.dogWins / sim.races).toFixed(1) + '%, 3rd-best-or-worse rated crow won ' + (100 * sim.upsets / sim.races).toFixed(1) + '%');
  console.log('  chaos events: ' + JSON.stringify(sim.events));
  ok(rows.every(r => r[1] > 0), 'every crow wins sometimes');
  ok(sim.dogWins / sim.races > 0.05 && sim.favWins / sim.races < 0.6, 'upsets genuinely happen (underdog wins ' + (100 * sim.dogWins / sim.races).toFixed(1) + '%)');
  // reset button
  p.on('dialog', d => d.accept());
  s = await p.evaluate(() => { localStorage.setItem('crowrace.board.v1', JSON.stringify({ x: { pts: 3, streak: 1, best: 2, t: 1 } })); return 1; });
  await p.reload(); await p.evaluate(() => CR.manual(true));
  const n0 = await p.evaluate(() => CR.topBoard().length);
  await p.evaluate(() => document.getElementById('bReset').click());
  ok(n0 === 1 && await p.evaluate(() => CR.topBoard().length === 0 && localStorage.getItem('crowrace.board.v1') === '{}'), 'Reset leaderboard button clears the board');
  await p.close();

  // ---------- 4. neutral theme: no "Croww" text anywhere on the canvas except the credit
  p = await open(browser, '?theme=neutral&test=1', true);
  await p.evaluate(() => { window.__texts = []; CR.render(); });
  await shot(p, 'title-neutral');
  await p.evaluate(() => { localStorage.setItem('crowrace.board.v1', JSON.stringify({ crowwfan99: { pts: 5, streak: 2, best: 3, t: 1 } })); });
  await p.evaluate(() => { CR.step(5.1); CR.render(); CR.step(7.1); window.__kickPush('crowwfan99', '!crow 1'); CR.step(25); });
  await shot(p, 'betting-neutral');
  await p.evaluate(() => { for (let i = 0; i < 200 && !(CR.G.R && CR.G.R.banner); i++) CR.step(0.25); CR.step(0.5); });
  await shot(p, 'race-neutral');
  await p.evaluate(() => { while (CR.G.phase !== 'results') { CR.step(0.5); CR.render(); } CR.render(); });
  await shot(p, 'results-neutral');
  await p.evaluate(() => { CR.G.paused = true; CR.render(); CR.G.paused = false; });
  s = await p.evaluate(c => { const all = [...new Set(window.__texts)]; return { bad: all.filter(t => /croww/i.test(t) && t !== c), credit: all.includes(c), title: document.title, theme: CR.theme }; }, CREDIT);
  ok(s.theme === 'neutral' && s.credit, '?theme=neutral works and the credit still shows');
  ok(s.bad.length === 0, 'neutral theme: no "Croww" text on screen except the credit' + (s.bad.length ? ' -> ' + JSON.stringify(s.bad) : ''));
  ok(!/croww/i.test(s.title), 'neutral page title has no Croww (' + s.title + ')');
  await p.goto(URL0); await p.evaluate(() => CR.manual(true));
  ok(await p.evaluate(() => CR.theme) === 'neutral', 'theme choice saved in localStorage');
  await p.select('#sTheme', 'croww'); ok(await p.evaluate(() => CR.theme === 'croww' && localStorage.getItem('crowrace.theme') === 'croww'), 'Settings dropdown switches back to croww live');
  await p.close();

  ok(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
