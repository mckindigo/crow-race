// Build: concatenates src/ into ONE self-contained index.html (Oswald font inlined; optional crow sprites from art/ inlined).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f));
const font = rd('build/oswald.woff2').toString('base64');
const fontCss = `<style>@font-face{font-family:"Oswald";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 700;font-display:block}</style>\n`;
let html = rd('src/head.html').toString().replace('<!--FONT-->', fontCss);
// optional sprites: art/<crow-id>.png (e.g. art/bigbeak.png). Missing files = code-drawn crow.
const art = {}, artDir = path.join(root, 'art');
if (fs.existsSync(artDir)) for (const f of fs.readdirSync(artDir)) if (/\.png$/i.test(f)) art[f.replace(/\.png$/i, '').toLowerCase()] = 'data:image/png;base64,' + rd('art/' + f).toString('base64');
html += `const ART_SRC = ${JSON.stringify(art)};\n`;
for (const f of ['1-core.js', '1b-theme.js', '2-race.js', '3-draw.js', '4-ui.js']) html += rd('src/' + f).toString();
html += rd('src/tail.html').toString();
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('built index.html (' + html.length + ' bytes, ' + Object.keys(art).length + ' sprites)');
