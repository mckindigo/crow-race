/* ===================================================================== drawing helpers */
const OUT = '#14101a';
function T(s, x, y, size, col, align, opt) {
  opt = opt || {}; if (!opt.raw) s = sayText(s);   // raw = the credit line, never rewritten
  ctx.font = `${opt.w || 700} ${size}px ${F}`; ctx.textAlign = align || 'left'; ctx.textBaseline = opt.base || 'middle';
  if (opt.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = opt.sw || Math.max(3, size * 0.16); ctx.strokeStyle = opt.stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
}
function fit(s, size, maxW, w) { s = sayText(s); ctx.font = `${w || 700} ${size}px ${F}`; if (ctx.measureText(s).width <= maxW) return s; while (s.length > 1 && ctx.measureText(s + '\u2026').width > maxW) s = s.slice(0, -1); return s + '\u2026'; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circ(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }
function ell(x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); }
function fs(fill, lw, stroke) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke || OUT; ctx.stroke(); } }
function badge(x, y, r, n, col) { circ(x, y, r); fs(col, Math.max(3, r * 0.14), OUT); T(String(n), x, y + r * 0.04, r * 1.25, '#fff', 'center', { stroke: OUT, sw: r * 0.16 }); }
const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

/* ===================================================================== the crow (code-drawn; art/<id>.png replaces it if present)
   x,y = body center, s = size in px (~ body length), o: { flap (0..1 wing angle source), stand, tilt, crown } */
function drawCrow(x, y, s, c, t, o) {
  o = o || {};
  ctx.save(); ctx.translate(x, y); if (o.tilt) ctx.rotate(o.tilt);
  if (artReady(c.id)) { const im = ART[c.id], k = s * 1.5 / Math.max(im.naturalWidth, im.naturalHeight); ctx.drawImage(im, -im.naturalWidth * k / 2, -im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); ctx.restore(); return; }
  const k = (c.small ? 0.82 : 1) * s / 100; ctx.scale(k, k);
  const lw = 4.5, body = c.grey ? '#6c717a' : c.id === 'midnight' ? '#1f2440' : '#2b2a36', belly = c.grey ? '#8d929b' : c.id === 'midnight' ? '#323a66' : '#403f50';
  const wing = c.grey ? '#575c64' : '#1d1c26', f = o.stand ? 0 : Math.sin(o.flap != null ? o.flap : t * 14);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tail
  ctx.beginPath(); ctx.moveTo(-36, -6); ctx.lineTo(-80, -22); ctx.lineTo(-86, -4); ctx.lineTo(-82, 14); ctx.lineTo(-36, 14); ctx.closePath(); fs(wing, lw);
  // legs (tucked while flying, standing when stopped)
  ctx.strokeStyle = '#e09a2e'; ctx.lineWidth = 6;
  if (o.stand) { ctx.beginPath(); ctx.moveTo(-4, 32); ctx.lineTo(-6, 58); ctx.moveTo(12, 32); ctx.lineTo(14, 58); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-6, 34); ctx.lineTo(-22, 44); ctx.moveTo(6, 36); ctx.lineTo(-10, 48); ctx.stroke(); }
  // far wing
  ctx.save(); ctx.translate(-2, -12); ctx.rotate(-0.5 - f * 0.55); ell(-20, 0, 36, 13); fs(wing, lw); ctx.restore();
  // body
  if (c.round) ell(0, 6, 46, 40); else ell(0, 6, 50, 34); fs(body, lw);
  ell(6, 18, 30, 16); fs(belly);
  // scarf in the crow's color (matches its number badge)
  ctx.save(); ctx.beginPath(); ctx.moveTo(14, -18); ctx.quadraticCurveTo(30, -4, 48, -14); ctx.lineTo(48, 0); ctx.quadraticCurveTo(28, 10, 12, -4); ctx.closePath(); fs(c.col, 3.5);
  ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(4, 16 + f * 4); ctx.lineTo(14, 18 + f * 4); ctx.lineTo(24, -2); ctx.closePath(); fs(c.col, 3.5); ctx.restore();
  // head
  circ(36, -26, 28); fs(body, lw);
  // beak
  const bl = c.acc === 'beak' ? 110 : 88; ctx.beginPath(); ctx.moveTo(56, -34); ctx.lineTo(bl, -22); ctx.lineTo(56, -12); ctx.closePath(); fs('#f2a33a', 4);
  ctx.strokeStyle = '#b8701e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(58, -23); ctx.lineTo(bl - 14, -22); ctx.stroke();
  // eye
  circ(46, -32, 12); fs('#fff', 3.5); circ(49, -31, 6.5); fs(OUT); circ(51, -34, 2.2); fs('#fff');
  // accessories
  switch (c.acc) {
    case 'mask': ctx.save(); rr(18, -42, 46, 16, 7); ctx.fillStyle = '#0b0a10'; ctx.fill(); circ(46, -33, 8); fs('#fff'); circ(49, -32, 5); fs(OUT); ctx.restore(); break;
    case 'bow': ctx.beginPath(); ctx.moveTo(30, -52); ctx.lineTo(14, -66); ctx.lineTo(14, -44); ctx.closePath(); fs(c.col, 3.5); ctx.beginPath(); ctx.moveTo(30, -52); ctx.lineTo(46, -68); ctx.lineTo(48, -46); ctx.closePath(); fs(c.col, 3.5); circ(30, -52, 6); fs('#fff', 3); break;
    case 'rapper':
      // backwards cap + compact shades keep Lil Caw recognizable even at race scale
      ctx.beginPath(); ctx.arc(34, -34, 31, Math.PI * 1.08, Math.PI * 2.02); ctx.lineTo(7, -48); ctx.lineTo(0, -38); ctx.lineTo(24, -39); ctx.closePath(); fs('#263b72', 4);
      ctx.beginPath(); ctx.moveTo(8, -43); ctx.lineTo(-18, -37); ctx.lineTo(8, -32); ctx.closePath(); fs('#263b72', 3);
      rr(26, -39, 37, 12, 5); fs('#101522', 3); ctx.strokeStyle = '#9bd4e8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(47, -38); ctx.lineTo(53, -29); ctx.stroke();
      ctx.save(); ctx.strokeStyle = '#f4c430'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(8, 16, 22, 0.16, 2.95); ctx.stroke(); circ(24, 31, 5); fs('#f4c430', 2, OUT); ctx.restore();
      break;
    case 'glasses': circ(47, -32, 14); ctx.lineWidth = 3.5; ctx.strokeStyle = '#e8e8e8'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(33, -34); ctx.lineTo(22, -36); ctx.stroke(); break;
    case 'tophat': rr(10, -58, 54, 8, 3); fs('#15141c', 3.5); rr(18, -94, 38, 38, 4); fs('#15141c', 3.5); rr(18, -66, 38, 8, 0); fs(c.col); break;
    case 'goggles': ctx.strokeStyle = c.col; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(36, -26, 28, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke(); circ(46, -36, 11); fs('rgba(190,230,255,0.8)', 4, c.col); break;
    case 'brows': ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(34, -50); ctx.lineTo(58, -40); ctx.stroke(); break;
    case 'shades': rr(32, -40, 30, 16, 6); fs('#0b0a10', 3); ctx.strokeStyle = '#0b0a10'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(32, -34); ctx.lineTo(16, -36); ctx.stroke(); ctx.strokeStyle = c.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(38, -36); ctx.lineTo(44, -30); ctx.stroke(); break;
  }
  if (o.crown) { ctx.beginPath(); ctx.moveTo(14, -54); ctx.lineTo(18, -82); ctx.lineTo(28, -66); ctx.lineTo(36, -88); ctx.lineTo(44, -66); ctx.lineTo(54, -82); ctx.lineTo(56, -54); ctx.closePath(); fs('#f4c430', 4); }
  // near wing (flaps)
  ctx.save(); ctx.translate(-4, -4); ctx.rotate(-0.25 - f * 0.7); ell(-18, 0, 40, 15); fs(wing, lw);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, 2); ctx.lineTo(-4, 2); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function drawHawk(x, y, s, t, dive) {
  // A broad, unmistakable raptor silhouette. Coordinates face down/right in a steep dive.
  dive = dive || 0; const k = s / 100, flap = Math.sin(t * 11) * 0.08;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(0.32 + dive * 0.14); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const feather = '#4b3429', feather2 = '#76533a', pale = '#eadfc4', beak = '#e0ad2d';
  // broad spread wings with separated flight feathers
  ctx.save(); ctx.rotate(-0.10 + flap); ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-126, -62); ctx.lineTo(-94, -28); ctx.lineTo(-164, -22); ctx.lineTo(-106, -4); ctx.lineTo(-150, 20); ctx.lineTo(-56, 18); ctx.lineTo(-14, 10); ctx.closePath(); fs(feather, 5); ctx.restore();
  ctx.save(); ctx.rotate(0.12 - flap); ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(112, -72); ctx.lineTo(92, -32); ctx.lineTo(160, -44); ctx.lineTo(104, -8); ctx.lineTo(145, 10); ctx.lineTo(54, 17); ctx.lineTo(10, 12); ctx.closePath(); fs(feather2, 5); ctx.restore();
  // wing bar highlights make the spread read at a glance
  ctx.strokeStyle = 'rgba(235,225,200,0.48)'; ctx.lineWidth = 4;
  for (const [x1, y1, x2, y2] of [[-116,-45,-62,2],[-133,-15,-66,7],[106,-49,54,4],[130,-25,60,8]]) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  // tapered banded tail
  ctx.beginPath(); ctx.moveTo(-30, 34); ctx.lineTo(-88, 82); ctx.lineTo(-48, 76); ctx.lineTo(-98, 108); ctx.lineTo(-20, 66); ctx.closePath(); fs(feather, 5);
  ctx.strokeStyle = '#c58e3e'; ctx.lineWidth = 9; for (const q of [0.3, 0.58, 0.82]) { ctx.beginPath(); ctx.moveTo(-51 - q * 27, 63 + q * 35); ctx.lineTo(-34 - q * 31, 74 + q * 28); ctx.stroke(); }
  // chest and body
  ell(0, 18, 40, 52, -0.08); fs(feather2, 5); ell(9, 28, 25, 36, -0.08); fs(pale, 3, '#9e8b70');
  ctx.strokeStyle = '#b6a281'; ctx.lineWidth = 4; for (let q = -1; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(-4 + q * 8, 2); ctx.lineTo(3 + q * 8, 50); ctx.stroke(); }
  // head, fierce brow, hooked yellow beak
  circ(30, -23, 31); fs(feather, 5); circ(40, -28, 10); fs('#fff', 3); circ(43, -27, 5); fs(OUT); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(26, -48); ctx.lineTo(48, -40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(57, -31); ctx.lineTo(93, -21); ctx.quadraticCurveTo(80, -3, 59, -12); ctx.closePath(); fs(beak, 4, '#9e741b'); ctx.strokeStyle = '#8d6315'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(62, -19); ctx.quadraticCurveTo(77, -17, 85, -12); ctx.stroke();
  // visible talons reaching toward the crow
  ctx.strokeStyle = beak; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-1, 54); ctx.lineTo(-8, 78); ctx.lineTo(-22, 86); ctx.moveTo(18, 55); ctx.lineTo(14, 78); ctx.lineTo(1, 87); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, 86); ctx.lineTo(-29, 82); ctx.moveTo(-22, 86); ctx.lineTo(-23, 77); ctx.moveTo(1, 87); ctx.lineTo(-6, 83); ctx.moveTo(1, 87); ctx.lineTo(2, 78); ctx.stroke();
  ctx.restore();
}

function star(x, y, r, rot, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.35 : r; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.closePath(); fs(col, 3); ctx.restore(); }

/* ===================================================================== shared chrome */
function drawBG() {
  const g = ctx.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, P.bgA); g.addColorStop(1, P.bgB); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = P.text; for (let y = 140; y < 1080; y += 60) for (let x = (y / 60 % 2) * 30; x < 1920; x += 60) { circ(x, y, 3); ctx.fill(); } ctx.restore();
}
function chatPill(x, y) {
  const live = Kick.status === 'live', test = settings.testMode === 'on';
  const txt = live && test ? 'KICK CHAT LIVE + TEST BOTS' : live ? 'KICK CHAT LIVE' : test ? 'TEST MODE (BOTS)' : Kick.status === 'connecting' ? 'CONNECTING TO CHAT' : 'CHAT OFFLINE';
  const col = live ? P.good : test ? P.hi : P.bad;
  ctx.font = `700 22px ${F}`; const w = ctx.measureText(txt).width + 56;
  rr(x - w, y - 20, w, 40, 20); fs(P.ink); circ(x - w + 22, y, 8); fs(col); T(txt, x - 18, y + 1, 22, P.bar, 'right');
}
function header(center, sub) {
  ctx.fillStyle = P.bar; ctx.fillRect(0, 0, 1920, 100); ctx.fillStyle = P.hi; ctx.fillRect(0, 100, 1920, 6);
  T('CROW RACE', 40, 52, 62, P.ink, 'left', { w: 700 }); ctx.font = `700 62px ${F}`; const lx = 40 + ctx.measureText('CROW RACE').width + 22;
  T(THEME.subtitle.replace(' PICKS', '\nPICKS').split('\n')[0], lx, 38, 20, P.muted, 'left', { w: 500 }); T('PICKS' + THEME.subtitle.split('PICKS')[1], lx, 64, 20, P.muted, 'left', { w: 500 });
  if (center) T(center, 1180, sub ? 40 : 52, sub ? 44 : 50, P.ink, 'center');
  if (sub) T(sub, 1180, 80, 22, P.muted, 'center', { w: 500 });
  chatPill(1890, 52);
}
function footer(h) { ctx.fillStyle = P.bar; ctx.fillRect(0, 1080 - (h || 80), 1920, h || 80); }
function credit(y, col) { T(CREDIT, 960, y, 20, col || P.muted, 'center', { w: 400, raw: true }); }   // shown in EVERY theme, never rewritten

function drawBoard(x, y, w, h, title) {
  rr(x, y, w, h, 22); fs(P.bgB, 4, P.hi);
  T(title || 'TOP PICKERS', x + w / 2, y + 44, 40, P.hi, 'center');
  T('this stream \u00b7 +1 per correct pick', x + w / 2, y + 82, 19, P.textDim, 'center', { w: 400 });
  const rows = topBoard(DATA.boardSize);
  T('PTS', x + w - 120, y + 116, 17, P.textDim, 'right', { w: 500 }); T('STREAK', x + w - 24, y + 116, 17, P.textDim, 'right', { w: 500 });
  if (!rows.length) { T('No points yet.', x + w / 2, y + 190, 30, P.text, 'center'); T('Pick the winner to get on the board!', x + w / 2, y + 230, 22, P.textDim, 'center', { w: 400 }); }
  rows.forEach((r, i) => {
    const yy = y + 150 + i * 46;
    if (i % 2 === 0) { rr(x + 12, yy - 21, w - 24, 42, 10); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill(); }
    T((i + 1) + '.', x + 50, yy, 26, i < 3 ? P.hi : P.textDim, 'right');
    T(fit(r.u, 26, w - 260, 600), x + 62, yy, 26, P.text, 'left', { w: 600 });
    T(String(r.pts), x + w - 120, yy, 28, P.hi, 'right');
    T(r.streak > 1 ? 'x' + r.streak : r.streak ? '1' : '-', x + w - 24, yy, 24, r.streak > 1 ? P.hi : P.textDim, 'right');
  });
}

/* ===================================================================== title */
function drawTitle(t) {
  drawBG();
  T('CROW RACE', 960, 380, 210, P.hi, 'center', { stroke: OUT, sw: 18 });
  T(THEME.subtitle, 960, 530, 42, P.text, 'center', { w: 500 });
  DATA.roster.slice(0, 6).forEach((c, i) => { const x = ((t * 260 + i * 330) % 2300) - 190; drawCrow(x, 720 + Math.sin(t * 3 + i) * 18, 110, c, t + i); });
  T('first race starting\u2026', 960, 880, 34, P.textDim, 'center', { w: 500 });
  credit(1040, P.textDim);
}

/* ===================================================================== lineup + betting */
function drawLineup(t) {
  drawBG();
  const lu = G.lineup, n = lu.crows.length, betting = G.phase === 'betting';
  const secs = Math.ceil(Math.max(0, G.t));
  header(betting ? 'BETTING CLOSES IN ' + secs : 'MEET THE RACERS', betting ? 'type !crow 1-' + n + ' in chat \u00b7 last pick counts' : 'race #' + G.raceNo + ' \u00b7 betting opens in ' + secs);
  if (betting) { const k = G.t / DATA.phase.betting; ctx.fillStyle = P.bad; ctx.fillRect(0, 100, 1920 * k, 6); }
  const top = 128, avail = 860, gap = 14, ch = Math.min(150, (avail - gap * (n - 1)) / n), oy = top + (avail - (ch * n + gap * (n - 1))) / 2;
  const tot = Math.max(1, G.picks.size);
  lu.crows.forEach((c, i) => {
    const y = oy + i * (ch + gap), cy = y + ch / 2, slide = G.phase === 'lineup' ? ease((DATA.phase.lineup - G.t) * 2.2 - i * 0.25) : 1;
    ctx.save(); ctx.translate((1 - slide) * -1400, 0);
    rr(40, y, 1250, ch, 20); fs(P.card, 3, P.cardLine);
    ctx.fillStyle = c.col; rr(40, y, 14, ch, [20, 0, 0, 20]); ctx.fill();
    badge(110, cy, Math.min(46, ch * 0.34), i + 1, c.col);
    drawCrow(245, cy + 4, ch * 0.72, c, t * 0.9 + i, { flap: Math.sin(t * 6 + i) * 0.6 });
    T(c.name.toUpperCase(), 350, cy - ch * 0.17, Math.min(50, ch * 0.36), P.cardInk);
    ctx.font = `700 ${Math.min(50, ch * 0.36)}px ${F}`; let tx = 350 + ctx.measureText(c.name.toUpperCase()).width + 18;
    const tag = i === lu.fav ? ['FAVORITE', P.good] : i === lu.dog ? ['UNDERDOG', P.gold] : null;
    if (tag) { ctx.font = `700 18px ${F}`; const tw = ctx.measureText(tag[0]).width + 20; rr(tx, cy - ch * 0.17 - 14, tw, 28, 14); fs(tag[1]); T(tag[0], tx + tw / 2, cy - ch * 0.17 + 1, 18, '#fff', 'center'); }
    T(c.line, 350, cy + ch * 0.2, Math.min(26, ch * 0.2), P.muted, 'left', { w: 500 });
    const stats = [['SPEED', pips(c.spd, 0.96, 1.07)], ['STAMINA', pips(c.sta, 0, 1)], ['LUCK', pips(c.luck, 0, 1)]];
    const sh = Math.min(30, ch / 3.6);
    stats.forEach(([lab, v], j) => {
      const sy = cy + (j - 1) * sh; T(lab, 860, sy, Math.min(17, sh * 0.62), P.muted, 'right', { w: 500 });
      for (let q = 0; q < 5; q++) { rr(872 + q * 26, sy - sh * 0.28, 21, sh * 0.56, 4); fs(q < v ? c.col : P.cardLine); }
    });
    const b = backers(i);
    T(String(b), 1262, cy - ch * 0.12, Math.min(58, ch * 0.42), P.cardInk, 'right');
    T(b === 1 ? 'BACKER' : 'BACKERS', 1262, cy + ch * 0.2, Math.min(17, ch * 0.13), P.muted, 'right', { w: 500 });
    rr(1040, cy + ch * 0.33, 222, 10, 5); fs(P.cardLine); if (b) { rr(1040, cy + ch * 0.33, 222 * b / tot, 10, 5); fs(c.col); }
    ctx.restore();
  });
  drawBoard(1320, 128, 560, 640);
  rr(1320, 786, 560, 202, 22); fs(P.card, 3, P.cardLine);
  T('HOW TO PLAY', 1600, 822, 30, P.gold, 'center');
  T('type  !crow 1-' + n + '  in chat', 1600, 872, 40, P.cardInk, 'center');
  T('one pick per race \u00b7 the LAST pick counts', 1600, 922, 22, P.muted, 'center', { w: 500 });
  T('switch any time until betting closes', 1600, 954, 22, P.muted, 'center', { w: 500 });
  footer(80);
  if (G.phase === 'lineup') credit(1040);
  else {
    T('LATEST PICKS', 40, 1040, 24, P.gold);
    let x = 220; for (const f of G.feed) { const s = fit(f.u, 24, 220, 600) + ' \u2192 #' + f.n + (f.sw ? ' (switched)' : ''); ctx.font = `600 24px ${F}`; const w = ctx.measureText(sayText(s)).width; if (x + w > 1780) break; T(s, x, 1040, 24, P.ink, 'left', { w: 600 }); x += w + 40; }
    if (!G.feed.length) T('nobody yet - be first!', x, 1040, 24, P.muted, 'left', { w: 500 });
    T(G.picks.size + ' picked', 1890, 1040, 24, P.ink, 'right');
  }
}

/* ===================================================================== race */
const FIELD = { top: 300, bot: 992, labelW: 300, x0: 340 };
function raceView() {
  const R = G.R, D = DATA.race, k = D.trackPx / D.L;
  const lead = Math.max(...R.crows.map(c => c.d)) * k;
  return { k, cam: clamp(lead - 1250, 0, D.trackPx - 1400) };
}
function drawRace(t) {
  const R = G.R, lu = G.lineup, n = R.crows.length, { k, cam } = raceView(), D = DATA.race;
  // sky + layered parallax course: sun, moving clouds, hills, rooftops and wires
  const g = ctx.createLinearGradient(0, 100, 0, FIELD.top); g.addColorStop(0, P.sky2); g.addColorStop(1, P.sky1); ctx.fillStyle = g; ctx.fillRect(0, 100, 1920, FIELD.top - 100 + 2);
  ctx.save(); ctx.globalAlpha = 0.72; circ(1560 - (cam * 0.04 % 260), 170, 48); fs(P.hi); circ(1560 - (cam * 0.04 % 260), 170, 72); ctx.globalAlpha = 0.09; fs(P.hi); ctx.restore();
  ctx.fillStyle = P.cloud; for (let i = 0; i < 7; i++) { const x = ((i * 380 - cam * 0.08 - t * 12) % 2400 + 2400) % 2400 - 240, y = 150 + (i * 53) % 90; ell(x, y, 80, 22); ctx.fill(); ell(x + 40, y - 14, 50, 22); ctx.fill(); }
  for (const [col, par, amp, base, fr] of [[P.hill1, 0.15, 40, FIELD.top - 50, 0.004], [P.hill2, 0.35, 28, FIELD.top - 14, 0.007]]) {
    ctx.beginPath(); ctx.moveTo(0, FIELD.top + 2); for (let x = 0; x <= 1920; x += 20) ctx.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin((x + cam * par) * fr) * Math.cos((x + cam * par) * fr * 0.37))); ctx.lineTo(1920, FIELD.top + 2); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  // A distant, slow-moving skyline gives the open-air race a sense of place.
  ctx.save(); ctx.globalAlpha = 0.34; const cityShift = (cam * 0.12) % 420;
  for (let bx = -80 - cityShift, i = 0; bx < 2050; bx += 86, i++) { const bw = 48 + (i * 17) % 34, bh = 28 + (i * 31) % 64, by = FIELD.top - 8 - bh; ctx.fillStyle = i % 3 ? P.hill2 : P.post; ctx.fillRect(bx, by, bw, bh); ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + bw * 0.5, by - 15 - (i % 2) * 8); ctx.lineTo(bx + bw + 5, by); ctx.closePath(); ctx.fill(); if (i % 2) { ctx.fillStyle = P.sky2; for (let wy = by + 12; wy < by + bh - 4; wy += 15) ctx.fillRect(bx + 10, wy, 7, 6); } }
  ctx.restore();
  // distant birds and telephone lines, deliberately faint so racers remain the focus
  ctx.save(); ctx.globalAlpha = 0.42; ctx.strokeStyle = P.post; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const wireShift = (cam * 0.18) % 360; for (let wx = -120 - wireShift; wx < 2100; wx += 360) { ctx.fillStyle = P.post; ctx.fillRect(wx - 4, 205, 8, 82); ctx.beginPath(); ctx.moveTo(wx - 4, 205); ctx.lineTo(wx + 4, 205); ctx.stroke(); }
  for (const wy of [220, 238]) { ctx.beginPath(); for (let wx = -150; wx <= 2050; wx += 24) ctx.lineTo(wx, wy + Math.sin(wx * 0.018 + cam * 0.01) * 3); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const bx = ((i * 291 - cam * 0.18 + t * 18) % 2300 + 2300) % 2300 - 160, by = 178 + (i * 37) % 66; ctx.beginPath(); ctx.moveTo(bx - 10, by); ctx.quadraticCurveTo(bx, by + 7, bx + 10, by); ctx.stroke(); }
  ctx.restore();
  // lanes: alternating tints, rope-like dividers and regularly spaced posts
  const lh = (FIELD.bot - FIELD.top) / n;
  for (let j = 0; j < n; j++) { const y = FIELD.top + j * lh; const lg = ctx.createLinearGradient(0, y, 1920, y + lh); lg.addColorStop(0, j % 2 ? P.laneB : P.laneA); lg.addColorStop(1, j % 2 ? P.laneA : P.laneB); ctx.fillStyle = lg; ctx.fillRect(0, y, 1920, lh); }
  ctx.save(); ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
  for (let j = 1; j < n; j++) { const y = FIELD.top + j * lh; ctx.strokeStyle = P.post; ctx.lineWidth = 4; ctx.beginPath(); for (let xx = 0; xx <= 1920; xx += 24) ctx.lineTo(xx, y + Math.sin(xx * 0.022 + cam * 0.012) * 3); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.beginPath(); for (let xx = 0; xx <= 1920; xx += 24) ctx.lineTo(xx, y - 3 + Math.sin(xx * 0.022 + cam * 0.012) * 3); ctx.stroke(); }
  const postShift = (cam * 0.35) % 260; ctx.fillStyle = P.post; for (let xx = -postShift; xx < 2050; xx += 260) for (let j = 1; j < n; j++) { const y = FIELD.top + j * lh; ctx.fillRect(xx - 4, y - 12, 8, 24); circ(xx, y - 13, 6); ctx.fill(); }
  ctx.restore();
  // tiny leaves and feathers scroll through the open course
  ctx.save(); ctx.globalAlpha = 0.34; ctx.lineWidth = 3; for (let i = 0; i < 15; i++) { const fx = ((i * 257 + t * (55 + i * 3) - cam * 0.7) % 2200 + 2200) % 2200 - 140, fy = FIELD.top + 35 + ((i * 83) % Math.max(80, FIELD.bot - FIELD.top - 70)); ctx.strokeStyle = i % 2 ? P.gold : P.hi; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + 14, fy - 9, fx + 25, fy + 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(fx + 10, fy - 4); ctx.lineTo(fx + 18, fy + 5); ctx.stroke(); }
  ctx.restore();
  const sx = px => FIELD.x0 + px - cam;
  ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let px = Math.floor(cam / 175) * 175; px < cam + 1800; px += 175) ctx.fillRect(sx(px), FIELD.top, 6, FIELD.bot - FIELD.top);
  for (let m = 0; m <= 1000; m += 100) { const x = sx(m * k); if (x < FIELD.x0 - 40 || x > 1960) continue; ctx.fillStyle = P.post; ctx.fillRect(x - 4, FIELD.top - 46, 8, 46); rr(x - 40, FIELD.top - 78, 80, 34, 8); fs(P.bar, 3, P.post); T(m === 0 ? 'START' : m === 1000 ? 'FINISH' : m + 'm', x, FIELD.top - 60, 20, P.ink, 'center'); }
  const startX = sx(0); if (startX > -80 && startX < 1940) { ctx.fillStyle = P.post; ctx.fillRect(startX - 10, FIELD.top - 18, 12, FIELD.bot - FIELD.top + 18); ctx.fillRect(startX + 72, FIELD.top - 18, 12, FIELD.bot - FIELD.top + 18); ctx.fillRect(startX - 10, FIELD.top - 30, 96, 12); for (let q = 0; q < 6; q++) { ctx.fillStyle = q % 2 ? P.ink : P.bar; ctx.fillRect(startX + q * 16 - 6, FIELD.top - 30, 16, 12); } }
  const fx = sx(D.trackPx); if (fx > -120 && fx < 2040) { for (let y = FIELD.top, r = 0; y < FIELD.bot; y += 24, r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = (r + c) % 2 ? P.ink : P.bar; ctx.fillRect(fx + c * 24, y, 24, 24); } ctx.fillStyle = P.post; ctx.fillRect(fx - 64, FIELD.top - 22, 8, 70); ctx.fillRect(fx + 42, FIELD.top - 22, 8, 70); for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) { ctx.fillStyle = (r + c) % 2 ? P.ink : P.bar; ctx.fillRect(fx - 60 + c * 14, FIELD.top - 70 + r * 14, 14, 14); } }
  // wind streaks
  if (R.crows.some(c => c.wind > 0)) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let i = 0; i < 26; i++) { const x = ((i * 157 + t * 1500) % 2200) - 140, y = 130 + (i * 97) % 850; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 110, y); ctx.stroke(); } ctx.restore(); }
  // crows
  R.crows.forEach((c, j) => {
    const cy = FIELD.top + j * lh + lh / 2, s = Math.min(120, lh * 0.85);
    const x = Math.max(FIELD.x0 + 60, sx(c.d * k)), y = cy + Math.sin(t * 4 + c.ph) * lh * 0.06;
    const boosted = c.boost > 0 || (c.wind > 0 && c.windK > 1);
    if (boosted) { ctx.save(); ctx.strokeStyle = c.c.col; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let q = 0; q < 3; q++) { const yy = y - 18 + q * 18, x0 = x - s * 0.9 - ((t * 600 + q * 40) % 60); ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 - 70, yy); ctx.stroke(); } ctx.restore(); }
    const back = c.back > 0, stop = !back && c.stop > 0 && !c.place;
    drawCrow(x, stop ? cy + lh * 0.08 : y, s, c.c, t + c.ph, { stand: stop, tilt: back ? Math.sin(t * 20) * 0.6 - 0.4 : 0, flap: t * (boosted ? 26 : 14) + c.ph });
    if (c.place) { const mc = ['#f4c430', '#c9ccd2', '#cd7f32'][c.place - 1] || P.muted; circ(x - s * 0.95, y - s * 0.35, 26); fs(mc, 4); T(ord(c.place), x - s * 0.95, y - s * 0.34, 22, OUT, 'center'); }
    if (x <= FIELD.x0 + 61 && !c.place) T('\u25C0 ' + Math.round(Math.max(0, (Math.max(...R.crows.map(q => q.d)) - c.d))) + 'm', FIELD.x0 + 4, cy + lh * 0.32, 20, P.bad, 'left');
  });
  // event effects
  for (const f of R.fx) {
    const c = R.crows[f.i], j = f.i, cy = FIELD.top + j * lh + lh / 2, x = Math.max(FIELD.x0 + 60, sx(c.d * k)), age = R.t - f.t0, s = Math.min(120, lh * 0.85);
    if (f.type === 'hawk') { /* drawn in a final pass above the lane labels and racers */ }
    else if (f.type === 'shiny' && age < f.dur) { star(x + s * 0.95, cy + s * 0.32, 22 + Math.sin(t * 10) * 5, t * 3, '#ffe066'); star(x + s * 1.25, cy - s * 0.1, 10, -t * 4, '#fff6b0'); }
    else if (f.type === 'worm' && age < 1.4) { ctx.save(); ctx.strokeStyle = '#e8829a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); for (let q = 0; q <= 6; q++) ctx.lineTo(x + s * 0.8 + q * 7, cy - s * 0.75 - age * 30 + Math.sin(q + t * 10) * 6); ctx.stroke(); ctx.restore(); }
    else if (f.type === 'updraft' && age < 2.5) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(x - 20 + q * 30, cy + s * 0.45 - ((age * 120 + q * 25) % 70), 16, Math.PI * 0.2, Math.PI * 1.6); ctx.stroke(); } ctx.restore(); }
  }
  // pinned lane labels
  R.crows.forEach((c, j) => {
    const y = FIELD.top + j * lh + 6, h = lh - 12;
    ctx.save(); ctx.globalAlpha = 0.94; rr(10, y, FIELD.labelW - 20, h, 14); fs(P.card, 3, c.c.col); ctx.restore();
    const r = Math.min(30, h * 0.3); badge(22 + r, y + h / 2, r, j + 1, c.c.col);
    T(fit(c.c.name.toUpperCase(), Math.min(28, h * 0.27), FIELD.labelW - 2 * r - 50), 2 * r + 36, y + h / 2 - h * 0.15, Math.min(28, h * 0.27), P.cardInk);
    const b = backers(j); T(b + (b === 1 ? ' backer' : ' backers'), 2 * r + 36, y + h / 2 + h * 0.2, Math.min(20, h * 0.2), P.muted, 'left', { w: 500 });
  });
  // hawk pass: it lives above the course, with a readable shadow and a clear near-miss/hit beat
  for (const f of R.fx) if (f.type === 'hawk') {
    const c = R.crows[f.i], j = f.i, cy = FIELD.top + j * lh + lh / 2, x = Math.max(FIELD.x0 + 60, sx(c.d * k)), age = R.t - f.t0, crowS = Math.min(120, lh * 0.85), hs = Math.max(190, crowS * 1.75), hit = c.back > 0;
    if (age >= 0 && age < 2.55) {
      const strike = age < 0.88 ? 0 : age < 1.22 ? (age - 0.88) / 0.34 : 1, leaving = age > 1.22 ? ease((age - 1.22) / 1.25) : 0;
      let hx, hy;
      if (age < 0.88) { const p = ease(age / 0.88); hx = lerp(x - 170, x - 12, p); hy = lerp(-260, cy - hs * 0.52, p); }
      else if (age < 1.22) { const p = ease((age - 0.88) / 0.34); hx = x + (hit ? lerp(-12, -34, p) : lerp(-12, 88, p)); hy = cy - hs * (hit ? 0.52 : 0.72); }
      else { hx = lerp(x + (hit ? -34 : 88), x + 360, leaving); hy = lerp(cy - hs * (hit ? 0.52 : 0.72), -300, leaving); }
      const depth = age < 1.12 ? ease(age / 1.12) : Math.max(0, 1 - (age - 1.12) / 1.35);
      ctx.save(); ctx.globalAlpha = 0.20 + depth * 0.24; ctx.fillStyle = OUT; ell(x + (hit ? -18 : 22), cy + crowS * 0.64, hs * (0.22 + depth * 0.46), 10 + depth * 16, 0.02); ctx.fill(); ctx.restore();
      if (strike > 0 && strike < 1) { ctx.save(); ctx.globalAlpha = 0.72 * Math.sin(strike * Math.PI); ctx.strokeStyle = hit ? P.bad : P.hi; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x + (hit ? -10 : 40), cy - hs * 0.25, hs * 0.38, -1.1, 1.2); ctx.stroke(); ctx.restore(); }
      if (age < 2.35) drawHawk(hx, hy, hs, t, 1 - leaving);
    }
  }
  // header + minimap
  ctx.fillStyle = P.bar; ctx.fillRect(0, 0, 1920, 100); ctx.fillStyle = P.hi; ctx.fillRect(0, 100, 1920, 6);
  T('CROW RACE', 40, 52, 62, P.ink); ctx.font = `700 62px ${F}`; T('RACE #' + G.raceNo, 62 + ctx.measureText('CROW RACE').width, 54, 30, P.muted);
  const mx0 = 520, mx1 = 1360; ctx.fillStyle = P.cardLine; rr(mx0, 46, mx1 - mx0, 12, 6); ctx.fill();
  for (let q = 0; q < 6; q++) { ctx.fillStyle = q % 2 ? '#111' : '#fff'; ctx.fillRect(mx1 + 4, 34 + q * 6, 6, 6); ctx.fillStyle = q % 2 ? '#fff' : '#111'; ctx.fillRect(mx1 + 10, 34 + q * 6, 6, 6); }
  order(R).slice().reverse().forEach(c => badge(lerp(mx0, mx1, clamp(c.d / D.L, 0, 1)), 52, 20, c.i + 1, c.c.col));
  T(R.t.toFixed(1) + 's', 1500, 52, 34, P.ink, 'right'); chatPill(1890, 52);
  // banner / GO
  if (R.t < 1.3) { const a = 1 - R.t / 1.3; ctx.save(); ctx.globalAlpha = Math.min(1, a * 2); T('GO!', 960, 200, 120 + R.t * 40, P.hi, 'center', { stroke: OUT, sw: 14 }); ctx.restore(); }
  else if (R.banner) {
    const b = R.banner, age = R.t - b.t0, sc = age < 0.25 ? 0.6 + 0.4 * ease(age / 0.25) : 1, al = clamp((DATA.chaos.banner - age) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = al; ctx.translate(960, 196); ctx.scale(sc, sc);
    rr(-620, -78, 1240, 156, 26); fs(P.ink, 6, P.hi);
    T(b.title, 0, -24, 66, P.hi, 'center'); T(b.sub, 0, 40, 32, P.bar, 'center', { w: 500 });
    ctx.restore();
  } else if (R.done || R.finish.length) { T(R.done ? 'ALL CROWS HOME!' : ord(R.finish.length) + ' PLACE IN\u2026', 960, 196, 64, P.ink, 'center', { stroke: P.bar, sw: 10 }); }
  // footer: positions
  footer(88); const od = order(R);
  T('POSITIONS', 40, 1036, 24, P.gold);
  let x = 200; od.forEach((c, q) => { badge(x + 20, 1036, 20, c.i + 1, c.c.col); const s = ord(q + 1) + ' ' + c.c.name; T(s, x + 50, 1037, 26, P.ink); ctx.font = `700 26px ${F}`; x += 80 + ctx.measureText(s).width; });
  T('betting closed', 1890, 1037, 22, P.muted, 'right', { w: 500 });
}

/* ===================================================================== results */
function drawResults(t) {
  drawBG();
  const res = G.result, lu = G.lineup, R = G.R, w = lu.crows[res.w];
  header('RACE #' + G.raceNo + ' RESULTS', 'next race in ' + Math.ceil(Math.max(0, G.t)));
  // winner card
  rr(40, 128, 720, 860, 24); fs(P.card, 4, w.col);
  T('WINNER', 400, 176, 38, P.gold, 'center');
  for (let i = 0; i < 26; i++) { const a = i * 2.4 + t, rr2 = 170 + (i * 37) % 90; ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = [w.col, P.hi, P.good, '#fff'][i % 4]; ctx.translate(400 + Math.cos(a * 0.4) * rr2 * 1.3, 410 + Math.sin(a * 0.5) * rr2 * 0.8); ctx.rotate(a); ctx.fillRect(-7, -4, 14, 8); ctx.restore(); }
  drawCrow(390, 420 + Math.sin(t * 3) * 8, 220, w, t, { crown: true, flap: Math.sin(t * 7) * 0.7 });
  badge(130, 590, 44, res.w + 1, w.col); T(w.name.toUpperCase(), 190, 592, 64, P.cardInk);
  T(G.R.crows[res.w].time ? 'finished in ' + G.R.crows[res.w].time.toFixed(1) + 's' : '', 190, 642, 24, P.muted, 'left', { w: 500 });
  if (res.upset) { ctx.save(); ctx.translate(620, 250); ctx.rotate(0.18 + Math.sin(t * 4) * 0.03); rr(-120, -42, 240, 84, 14); fs(P.bad, 5, OUT); T(res.dog ? 'UNDERDOG!' : 'UPSET!', 0, 2, res.dog ? 44 : 54, '#fff', 'center'); ctx.restore(); }
  const od = R.finish; od.forEach((ci, q) => {
    const c = lu.crows[ci], y = 712 + q * 44, k = R.crows[ci];
    T(ord(q + 1), 100, y, 28, q === 0 ? P.gold : P.muted, 'right'); badge(136, y, 17, ci + 1, c.col);
    T(c.name, 166, y, 28, P.cardInk); T(k.time ? k.time.toFixed(1) + 's' : 'DNF', 720, y, 24, P.muted, 'right', { w: 500 });
  });
  // correct pickers
  rr(790, 128, 500, 860, 24); fs(P.bgB, 4, P.hi);
  T('PICKED #' + (res.w + 1) + ' \u00b7 +1', 1040, 176, 38, P.hi, 'center');
  T(res.winners.length + ' of ' + res.picked + ' chatters got it right', 1040, 216, 22, P.textDim, 'center', { w: 400 });
  if (!res.winners.length) { T(res.picked ? 'Nobody picked ' + w.name + '!' : 'No picks this race', 1040, 420, 36, P.text, 'center'); T(res.picked ? 'ouch.' : 'type !crow N next time', 1040, 470, 26, P.textDim, 'center', { w: 400 }); }
  const max = 14; res.winners.slice(0, max).forEach((p, i) => {
    const y = 268 + i * 48; T(fit(p.u, 28, 300, 600), 830, y, 28, P.text, 'left', { w: 600 });
    T(p.streak > 1 ? 'STREAK x' + p.streak : '+1', 1250, y, 24, p.streak > 1 ? P.hi : P.textDim, 'right');
  });
  if (res.winners.length > max) T('+ ' + (res.winners.length - max) + ' more', 1040, 268 + max * 48, 24, P.textDim, 'center');
  drawBoard(1320, 128, 560, 860);
  footer(80); T('NEXT RACE IN ' + Math.ceil(Math.max(0, G.t)), 960, 1040, 34, P.ink, 'center');
}

/* ===================================================================== frame */
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  if (G.phase === 'title') drawTitle(t);
  else if (G.phase === 'lineup' || G.phase === 'betting') drawLineup(t);
  else if (G.phase === 'race') drawRace(t);
  else if (G.phase === 'results') drawResults(t);
  if (G.paused) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 1920, 1080); T('PAUSED', 960, 500, 140, P.hi, 'center', { stroke: OUT, sw: 14 }); T('press P to resume', 960, 610, 34, '#fff', 'center', { w: 500 }); }
}
