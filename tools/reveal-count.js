const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const r=(html.match(/class="[^"]*\breveal\b[^"]*"/g)||[]).length;
console.log('elements with .reveal class:', r);
const samples=[...html.matchAll(/class="([^"]*\breveal\b[^"]*)"/g)].slice(0,6).map(m=>m[1]);
samples.forEach(s=>console.log('  '+s));
console.log('confetti-canvas present:', /id="confetti-canvas"/.test(html));
console.log('data-gallery-grid present:', /data-gallery-grid/.test(html));
console.log('vault cards:', (html.match(/vault-card|memory-card|data-media-open/g)||[]).length);
