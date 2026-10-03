# Crow Race

A hands-off chat betting game for Kick streams, made as a 1920x1080 OBS browser source. 4-6 cartoon crows race, chat bets with `!crow N`, and the people who pick the winner climb a leaderboard that lasts the whole stream.

**Live:** https://mckindigo.github.io/crow-race/

## The loop (runs by itself)
1. **Lineup** (7s): numbered crows with a personality line and SPEED / STAMINA / LUCK pips. FAVORITE and UNDERDOG tags.
2. **Betting** (30s): chat types `!crow 1` to `!crow N`. One pick per chatter per race, and **the last pick counts** (you can switch until betting closes). Backer counts update live.
3. **Race** (~30s): side-scrolling, with chaos events: WIND GUST (pushes the back of the pack), OOH SHINY (a crow stops for loot; greedy crows more often), HAWK SWOOP (usually hits the leader; luck can dodge it), WORM SNACK (sugar-rush boost), LUCKY UPDRAFT (last place rockets forward).
4. **Results** (13s): winner, everyone who picked it gets +1 and their streak goes up (a wrong pick resets the streak). Then the next race starts.

There are no subscriber perks. Everyone's pick counts the same.

## OBS
Browser source, URL above, 1920x1080. Keys (use Interact in OBS): **S** settings, **P** pause/resume (there's also a small pause button bottom-right), **N** skip to the next phase.

Settings: Kick channel and chatroom id (default `croww` / `962037`; read-only public chat socket, no login), Test mode (fake chat bots; Off removes every bot pick and bot leaderboard row), Theme, Reset leaderboard.

URL options: `?theme=neutral` (no branding; saved), `?test=1`, `?channel=<slug>&room=<id>`, `?connect=0`.

## Themes
`croww` (default, cream/maroon/olive/tan) and `neutral` (Art's slate/teal palette, no "Croww" text except the small credit). See `src/1b-theme.js`.

## Optional sprites
Drop `art/<crow-id>.png` (e.g. `art/bigbeak.png`) and rebuild. Each one replaces that code-drawn crow. Ids are in `DATA.roster` in `src/1-core.js`.

## Dev
`node tools/build.js` concatenates `src/` into the single `index.html`. `node tools/verify.js` runs the headless checks (needs `npm i` and Chrome at /usr/bin/google-chrome) and writes screenshots to `shots/`.

made by Croww · kick.com/croww
