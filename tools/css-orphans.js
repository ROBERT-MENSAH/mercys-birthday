const fs = require('fs');
const lines = fs.readFileSync('css/sections.css','utf8').split(/\r?\n/);
function prevNonBlank(i) { for (let j = i-1; j >= 0; j--) { if (lines[j].trim() !== '') return lines[j]; } return ''; }
const decl = /^\s{2,}[a-z-]+\s*:[^;{}]*;\s*$/;
let depth = 0;
const report = [];
lines.forEach((raw, i) => {
  const p = prevNonBlank(i);
  const prevClosed = /^\s*}\s*$/.test(p);
  if (prevClosed && decl.test(raw)) report.push(i+1);
  for (const ch of raw) { if (ch === '{') depth++; else if (ch === '}') depth--; }
});
console.log('ORPHAN BODIES (selector missing) at lines:');
console.log(report.join(', '));
// Show each orphan block extent
for (const start of report) {
  console.log('\n--- orphan starting line ' + start + ' ---');
  console.log('  prev rule ends: ' + JSON.stringify(prevNonBlank(start-1).trim()));
  let i = start - 1;
  while (i < lines.length && !/^\s*}\s*$/.test(lines[i])) i++;
  for (let k = start-1; k <= i; k++) console.log('  ' + (k+1) + ' | ' + lines[k]);
}
console.log('\nfinal depth: ' + depth);
