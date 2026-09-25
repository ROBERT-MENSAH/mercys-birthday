const fs = require('fs');
const lines = fs.readFileSync('index.html','utf8').split(/\r?\n/);
const secRe = /<section[\s>]/;
const opens = [];
lines.forEach((l,i) => { if (secRe.test(l)) opens.push(i); });
function count(a, b, re) { let n=0; for (let i=a;i<=b;i++){ const m = lines[i].match(re); if(m) n+=m.length;} return n; }
for (let k=0;k<opens.length;k++) {
  const s = opens[k];
  const e = (k+1 < opens.length) ? opens[k+1]-1 : lines.length-1;
  const dOpen = count(s,e,/<div[\s>]/g);
  const dClose = count(s,e,/<\/div>/g);
  const name = (lines[s].match(/id="([^"]+)"/) || [,lines[s].trim().slice(0,40)])[1];
  console.log(String(s+1).padStart(4), name.padEnd(20), 'div open='+dOpen, 'close='+dClose, (dOpen===dClose ? 'BALANCED' : 'DEFICIT '+(dOpen-dClose)));
}
