'use strict';
/* =====================================================================
   CROW RACE - all tunable numbers live here
   ===================================================================== */
const DATA = {
  W: 1920, H: 1080,
  // phase lengths (seconds). The race itself ends when every crow has crossed (raceCap = hard stop).
  phase: { title: 5, lineup: 7, betting: 30, raceCap: 45, afterFinish: 2.5, results: 13 },
  crowsPerRace: [4, 6],
  // race physics: track length in units; v0 so an average crow takes ~29s with no chaos
  race: { L: 1000, avgTime: 30, trackPx: 7000, wobble: 0.05, fadeFrom: 0.55, fadeMax: 0.10 },
  // chaos: first event after `first` s, then every gap[0..1] s, only while the leader is between 8% and 88% of the track
  chaos: { first: 4, gap: [3.6, 6.2], banner: 3.2,
    weights: { wind: 1, shiny: 1.1, hawk: 1.15, worm: 0.8, updraft: 0.75 } },
  // the roster. Stats subtly change the race: spd = base speed, sta = late-race stamina, luck = dodges hawks / finds worms,
  // greed = how likely (and how long) the crow stops for something shiny. Bars on the lineup show them as 1-5 pips.
  roster: [
    { id: 'bigbeak',     name: 'Big Beak',     line: 'All beak, no brakes.',              spd: 1.035, sta: 0.45, luck: 0.30, greed: 0.30, acc: 'beak',    col: '#d9583b' },
    { id: 'shinythief',  name: 'Shiny Thief',  line: 'Stops for anything that glitters.', spd: 1.045, sta: 0.60, luck: 0.50, greed: 1.00, acc: 'mask',    col: '#e0b030' },
    { id: 'lilcaw',      name: 'Lil Caw',      line: 'Tiny, fearless, weirdly lucky.',    spd: 0.970, sta: 0.70, luck: 0.95, greed: 0.30, acc: 'bow',     col: '#e86fa0', small: true },
    { id: 'oldfeathers', name: 'Old Feathers', line: 'Slow start. Never gets tired.',     spd: 0.970, sta: 1.00, luck: 0.60, greed: 0.10, acc: 'glasses', col: '#9aa0a6', grey: true },
    { id: 'sirsquawks',  name: 'Sir Squawks',  line: 'Top hat. Bigger ego.',              spd: 1.020, sta: 0.60, luck: 0.40, greed: 0.45, acc: 'tophat',  col: '#7b5cd6' },
    { id: 'midnight',    name: 'Midnight',     line: 'Silent, fast, a little spooky.',    spd: 1.030, sta: 0.40, luck: 0.40, greed: 0.20, acc: 'none',    col: '#4f7dd9' },
    { id: 'pebble',      name: 'Pebble',       line: 'Round, steady, unbothered.',        spd: 0.985, sta: 0.90, luck: 0.50, greed: 0.20, acc: 'none',    col: '#5fae6e', round: true },
    { id: 'zippy',       name: 'Zippy',        line: 'Starts hot. Runs out of gas.',      spd: 1.065, sta: 0.05, luck: 0.30, greed: 0.40, acc: 'goggles', col: '#f08a24' },
    { id: 'grumbles',    name: 'Grumbles',     line: 'Hates hawks. Hates everything.',    spd: 1.000, sta: 0.70, luck: 0.20, greed: 0.25, acc: 'brows',   col: '#b04848', grit: true },
    { id: 'discodot',    name: 'Disco Dot',    line: 'Only here for the vibes.',          spd: 0.990, sta: 0.50, luck: 0.85, greed: 0.65, acc: 'shades',  col: '#2bb3b3' }
  ],
  bots: { names: ['test_pixelpie', 'test_nightowl', 'test_crumbs', 'test_lazyfern', 'test_bopbop', 'test_mothman', 'test_kettle', 'test_zigzag', 'test_ravenfan', 'test_soupy', 'test_glimmer', 'test_tater', 'test_quill', 'test_mossy'],
    lines: ['lets gooo', 'CAW CAW', 'this crow is cooked', 'hawk incoming', 'shiny thief always stops lol', 'go go go', 'W race', 'that was rigged', 'my crow is sleeping', 'GG'] },
  kick: { pusherKey: '32cbd69e4b950bf97679', cluster: 'us2', version: '8.4.0-rc2', knownRooms: { croww: '962037' }, pingEvery: 60 },
  boardSize: 10
};

/* ===================================================================== utils */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const F = '"Oswald","Trebuchet MS","Segoe UI","DejaVu Sans",Verdana,sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function weighted(items, w) { let s = 0; for (const it of items) s += Math.max(0, w(it)); let r = Math.random() * s; for (const it of items) { r -= Math.max(0, w(it)); if (r <= 0) return it; } return items[items.length - 1]; }
const ART = {}; for (const k in (typeof ART_SRC !== 'undefined' ? ART_SRC : {})) { const im = new Image(); im.src = ART_SRC[k]; ART[k] = im; }
function artReady(k) { const im = ART[k]; return !!(im && im.complete && im.naturalWidth); }

/* ===================================================================== settings (saved on this PC) */
const SKEY = 'crowrace.settings.v1';
const settings = Object.assign({ channel: 'croww', rooms: {}, testMode: 'off', autoConnect: true },
  (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } })());
settings.rooms = Object.assign({}, DATA.kick.knownRooms, settings.rooms || {});
if (settings.testMode !== 'on') settings.testMode = 'off';
function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} }
const qs = new URLSearchParams(location.search);
if (qs.get('channel')) settings.channel = qs.get('channel').toLowerCase();
if (qs.get('room')) settings.rooms[settings.channel] = qs.get('room');
if (qs.has('test')) settings.testMode = ['1', 'on', 'true', 'yes'].includes(qs.get('test').toLowerCase()) ? 'on' : 'off';
if (qs.get('connect') === '0') settings.autoConnect = false;

/* ===================================================================== Kick live chat (read-only public Pusher socket, no login) */
const Kick = {
  ws: null, status: 'off', detail: 'not connected', retry: 0, timer: null, pingT: null, gen: 0, msgs: 0,
  room() { return settings.rooms[settings.channel] || ''; },
  set(s, d) { this.status = s; this.detail = d; if (typeof updateStatusUI === 'function') updateStatusUI(); },
  async lookup() {
    const ch = settings.channel;
    this.set('connecting', 'looking up chatroom id for ' + ch + '...');
    try {
      const r = await fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(ch), { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(), id = j && j.chatroom && j.chatroom.id;
      if (!id) throw new Error('no chatroom id');
      settings.rooms[ch] = String(id); saveSettings(); if (typeof syncSettingsUI === 'function') syncSettingsUI();
      return String(id);
    } catch (e) { this.set('error', 'lookup blocked (' + e.message + ') - paste the chatroom id in settings'); return ''; }
  },
  async connect() {
    this.disconnect(true);
    const gen = ++this.gen;
    let id = this.room();
    if (!id) id = await this.lookup();
    if (!id || gen !== this.gen) return;
    this.set('connecting', 'connecting to #' + settings.channel + ' (room ' + id + ')...');
    const url = `wss://ws-${DATA.kick.cluster}.pusher.com/app/${DATA.kick.pusherKey}?protocol=7&client=js&version=${DATA.kick.version}&flash=false`;
    let ws;
    try { ws = new WebSocket(url); } catch (e) { this.set('error', 'websocket failed: ' + e.message); return; }
    this.ws = ws;
    ws.onmessage = ev => {
      if (gen !== this.gen) return;
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.event === 'pusher:connection_established') ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel: 'chatrooms.' + id + '.v2' } }));
      else if (m.event === 'pusher_internal:subscription_succeeded') { this.retry = 0; this.set('live', 'LIVE: reading #' + settings.channel + ' chat (room ' + id + ')'); }
      else if (m.event === 'pusher:ping') ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
      else if (m.event === 'pusher:error') this.set('error', 'pusher error: ' + JSON.stringify(m.data).slice(0, 80));
      else if (m.event === 'App\\Events\\ChatMessageEvent') {
        let d = m.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return; } }
        if (d && d.sender && d.content != null) { this.msgs++; onChat(d.sender.username, d.content, 'kick'); }
      }
    };
    ws.onclose = () => {
      if (gen !== this.gen) return;
      this.ws = null; this.retry++;
      const wait = Math.min(30, 2 * this.retry);
      this.set('error', 'disconnected - retrying in ' + wait + 's');
      this.timer = setTimeout(() => { if (gen === this.gen) this.connect(); }, wait * 1000);
    };
    ws.onerror = () => {};
    this.pingT = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ event: 'pusher:ping', data: {} })); }, DATA.kick.pingEvery * 1000);
  },
  disconnect(silent) {
    this.gen++; clearTimeout(this.timer); clearInterval(this.pingT);
    if (this.ws) { try { this.ws.close(); } catch (e) {} this.ws = null; }
    if (!silent) this.set('off', 'disconnected');
  }
};
