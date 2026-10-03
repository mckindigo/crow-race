/* ===================================================================== settings UI + keys */
function $(id) { return document.getElementById(id); }
let settingsOpen = false;
function toggleSettings(v) { settingsOpen = v == null ? !settingsOpen : v; $('settings').classList.toggle('hidden', !settingsOpen); if (settingsOpen) syncSettingsUI(); }
function setPaused(v) { G.paused = v == null ? !G.paused : !!v; $('pauseBtn').textContent = G.paused ? '\u25B6' : 'II'; }
function updateStatusUI() {
  const el = $('sStatus'); if (!el) return;
  const col = { live: '#3dff7a', connecting: '#ffd23f', error: '#ff6070', off: '#bfae86' }[Kick.status];
  el.innerHTML = `<span style="color:${col}">\u25CF ${Kick.status.toUpperCase()}</span>&nbsp; <span class="hint">${String(Kick.detail).replace(/</g, '&lt;')}</span>`;
}
function syncSettingsUI() {
  $('sChannel').value = settings.channel; $('sRoom').value = settings.rooms[settings.channel] || ''; $('sTest').value = settings.testMode;
  themeOptions(); $('vReset').textContent = Object.keys(board).length + ' chatters on the board'; updateStatusUI();
}
function themeOptions() { $('sTheme').innerHTML = Object.values(THEMES).map(th => `<option value="${th.id}">${(THEME.say && th.plainLabel) || th.label}</option>`).join(''); $('sTheme').value = THEME.id; }
function readChannel() { const ch = $('sChannel').value.trim().toLowerCase().replace(/^https?:\/\/(www\.)?kick\.com\//, '').replace(/[^a-z0-9_\-]/g, ''); if (ch && ch !== settings.channel) { settings.channel = ch; $('sRoom').value = settings.rooms[ch] || ''; } }
$('sChannel').addEventListener('change', () => { readChannel(); saveSettings(); });
$('sRoom').addEventListener('change', () => { const v = $('sRoom').value.trim().replace(/\D/g, ''); if (v) settings.rooms[settings.channel] = v; else delete settings.rooms[settings.channel]; saveSettings(); });
$('bConnect').onclick = () => { readChannel(); const v = $('sRoom').value.trim().replace(/\D/g, ''); if (v) settings.rooms[settings.channel] = v; settings.autoConnect = true; saveSettings(); Kick.connect(); };
$('bDisconnect').onclick = () => { settings.autoConnect = false; saveSettings(); Kick.disconnect(); };
$('bLookup').onclick = async () => { readChannel(); delete settings.rooms[settings.channel]; $('sRoom').value = ''; const id = await Kick.lookup(); if (id) Kick.connect(); };
function setTestMode(on) {
  settings.testMode = on ? 'on' : 'off'; saveSettings();
  try { if (qs.has('test')) { qs.delete('test'); const s = qs.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } } catch (e) {}
  if (on) { if (G.phase === 'lineup' || G.phase === 'betting') BOT.plan(); } else BOT.purge();
  syncSettingsUI();
}
$('sTest').onchange = () => setTestMode($('sTest').value === 'on');
$('sTheme').onchange = () => {
  setTheme($('sTheme').value, true); themeOptions();
  try { if (qs.has('theme')) { qs.delete('theme'); const s = qs.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } } catch (e) {}
};
$('bReset').onclick = () => { if (confirm('Reset the Crow Race leaderboard (all points and streaks)?')) { resetBoard(); syncSettingsUI(); } };
$('bPause').onclick = () => setPaused();
$('pauseBtn').onclick = () => setPaused();
$('bClose').onclick = () => toggleSettings(false);
function sendFake() { const u = $('fUser').value.trim() || 'tester', m = $('fMsg').value.trim(); if (!m) return; onChat(u, m, 'manual'); $('fMsg').value = ''; }
$('bSend').onclick = sendFake; $('fMsg').addEventListener('keydown', e => { if (e.key === 'Enter') sendFake(); });
window.addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === 's') toggleSettings();
  else if (k === 'escape' && settingsOpen) toggleSettings(false);
  else if (k === 'p') setPaused();
  else if (k === 'n' && !G.paused) skipPhase();
});

/* ===================================================================== scale + loop */
function resize() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); $('stage').style.transform = `translate(${(innerWidth - 1920 * s) / 2}px,${(innerHeight - 1080 * s) / 2}px) scale(${s})`; }
window.addEventListener('resize', resize); resize();
syncSettingsUI();
if (document.fonts) document.fonts.load('700 40px Oswald');
if (settings.autoConnect) Kick.connect(); else Kick.set('off', 'auto-connect off - press Connect');
let last = performance.now(), manual = false;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;   // clamped: a hidden tab never jumps
  if (!manual) update(dt);
  render(G.anim);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
/* console / test hooks */
window.CR = {
  G, DATA, settings, Kick, BOT, onChat, setPhase, skipPhase, setTheme, setTestMode, setPaused, simulate, topBoard, resetBoard, toggleSettings,
  get board() { return board; }, get theme() { return THEME.id; },
  step(sec, dt) { dt = dt || 1 / 30; const n = Math.round(sec / dt); for (let i = 0; i < n; i++) update(dt); },
  manual(v) { manual = v; }, render(t) { render(t != null ? t : G.anim); }
};
