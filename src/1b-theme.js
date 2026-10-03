/* =====================================================================
   THEMES - the look (colors + wording). Race logic never reads this.
   - 'croww' (default): Croww brand palette (cream #FEF9E5, maroon #4A1A1A, olive #606248, tan #967846).
   - 'neutral': no Croww name anywhere except the credit line. Colors = Art's palette (chat-clash brand/neutral/palette.json).
   Every canvas string goes through sayText(); the neutral theme's `say` list is a catch-all so a stray "croww"
   (e.g. a chatter's name) never reaches the screen. The credit line is drawn raw (never rewritten).
   Selection: ?theme=<id> (also saved), else localStorage 'crowrace.theme', else 'croww'. Settings > Theme switches live.
   ===================================================================== */
const THEMES = {
  croww: {
    id: 'croww', label: 'Croww (default)', plainLabel: 'Original (default)', docTitle: 'Crow Race - Croww',
    subtitle: "CROWW'S CHAT PICKS THE WINNER",
    pal: { bar: '#FEF9E5', ink: '#4A1A1A', muted: '#606248', gold: '#967846', accent: '#606248', hi: '#d9a441', good: '#3f6b35', bad: '#b23a2a',
      bgA: '#4A1A1A', bgB: '#260c0c', card: '#FEF9E5', cardInk: '#4A1A1A', cardLine: '#d8c9a0', text: '#FEF9E5', textDim: '#d4c49c',
      sky1: '#FEF9E5', sky2: '#f1dfb0', cloud: '#fffdf4', hill1: '#a3a47c', hill2: '#606248', laneA: '#e9d9ac', laneB: '#dfcc98', laneLine: '#c7ae74', post: '#7a5f36' }
  },
  neutral: {
    id: 'neutral', label: 'Neutral (no branding)', docTitle: 'Crow Race', subtitle: 'CHAT PICKS THE WINNER',
    pal: { bar: '#F4F6F9', ink: '#1E293B', muted: '#5B6B80', gold: '#B45309', accent: '#0D9488', hi: '#F59E0B', good: '#16A34A', bad: '#DC2626',
      bgA: '#1E293B', bgB: '#0F172A', card: '#FFFFFF', cardInk: '#1E293B', cardLine: '#D5DCE5', text: '#F4F6F9', textDim: '#CBD5E1',
      sky1: '#F4F6F9', sky2: '#D5DCE5', cloud: '#FFFFFF', hill1: '#94A3B8', hill2: '#5B6B80', laneA: '#E8EDF3', laneB: '#DCE3EB', laneLine: '#B8C4D2', post: '#5B6B80' },
    say: [[/\bCROWW'S\b/g, "THE STREAMER'S"], [/\bCroww's\b/g, "the streamer's"], [/croww/gi, m => m === 'CROWW' ? 'STREAMER' : 'streamer']]
  }
};
const THEME_KEY = 'crowrace.theme';
let THEME = THEMES.croww, P = THEME.pal;
const CREDIT = 'made by Croww \u00b7 kick.com/croww';
function sayText(s) { if (!THEME.say || typeof s !== 'string' || !/croww/i.test(s)) return s; for (const [re, rep] of THEME.say) s = s.replace(re, rep); return s; }
function setTheme(id, save) {
  THEME = THEMES[id] || THEMES.croww; P = THEME.pal;
  if (save) try { localStorage.setItem(THEME_KEY, THEME.id); } catch (e) {}
  document.title = THEME.docTitle;
  const r = document.documentElement.style;   // settings box + pause button colors
  r.setProperty('--panel', P.bgA); r.setProperty('--accent', P.hi); r.setProperty('--line', P.muted); r.setProperty('--btn', P.bgB); r.setProperty('--ink2', P.text);
}
(function () {
  let id = String(qs.get('theme') || '').trim().toLowerCase(), save = !!THEMES[id];
  if (!THEMES[id]) { try { id = localStorage.getItem(THEME_KEY); } catch (e) { id = null; } }
  setTheme(THEMES[id] ? id : 'croww', save);
})();
