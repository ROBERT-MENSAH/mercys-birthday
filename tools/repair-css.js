const fs = require('fs');
const path = 'css/sections.css';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const fail = m => { console.error('ABORT: ' + m); process.exit(1); };
const moves = [
  [1043, 1045,  933, 'height: 22%'],
  [1065, 1068,  800, 'background: linear-gradient(90deg'],
  [1084, 1092,  667, 'content: ""'],
  [1115, 1117,  434, 'gap: var(--space-xs)'],
  [1136, 1142,  289, 'overflow: hidden'],
  [1162, 1166,  151, 'color: var(--pink-medium)']
];
const del = new Set();
const inserts = {};
for (const [a, b, after, expect] of moves) {
  const block = lines.slice(a - 1, b);
  if (!block.length || !block[0].trim().startsWith(expect)) fail('unexpected L' + a + ': ' + JSON.stringify(block[0]));
  if (!/^\s*}\s*$/.test(block[block.length - 1])) fail('L' + a + ' block does not end with }');
  if (inserts[after]) fail('duplicate target ' + after);
  inserts[after] = block;
  for (let i = a; i <= b; i++) del.add(i);
  console.log('move L' + a + '-' + b + ' (' + block.length + ') -> after L' + after);
}
const out = [];
for (let i = 1; i <= lines.length; i++) {
  if (!del.has(i)) out.push(lines[i - 1]);   // emit original line i
  if (inserts[i]) out.push(...inserts[i]);    // then the block AFTER it
}
let text = out.join('\n');
const n = (text.match(/--pink-medium/g) || []).length;
text = text.replace(/var\(--pink-medium\)/g, 'var(--pink-primary)');
console.log('pink-medium -> pink-primary: ' + n);
if (text.includes('--pink-medium')) fail('still present');
fs.writeFileSync(path, text, 'utf8');
console.log('WROTE ' + out.length + ' lines');
