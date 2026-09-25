const fs = require('fs');
const path = 'index.html';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
function fail(m) { console.error('ABORT: ' + m); process.exit(1); }

// 1. Locate </html> - everything after it is stranded tail.
const htmlClose = lines.findIndex(l => l.trim() === '</html>');
if (htmlClose < 0) fail('no </html>');
console.log('</html> at 1-based line ' + (htmlClose + 1));

const scope = lines.slice(0, htmlClose + 1);
const tail = lines.slice(htmlClose + 1); // blank line + stranded blocks
const base = lines.findIndex(l => l.includes('secret-seal__tooltip')) - 1; // line 561 index
if (base < 0) fail('tail start not found');
// Work on the stranded region only (relative to first stranded content line)
const t = lines.slice(base);
if (t.length < 43) fail('tail too short: ' + t.length);
if (!/motto-band/.test(t[8])) fail('t[8] expected motto-band, got: ' + t[8]);
if (!/chapter-actions--center/.test(t[22])) fail('t[22] expected chapter-actions');
if (!/chapter-transition__rule/.test(t[39])) fail('t[39] expected transition rule');
if (t[6].trim() !== '</main>') fail('t[6] expected </main>, got: ' + t[6]);

const B = {
  trans: t.slice(39, 43),
  ch02:  t.slice(36, 38),
  ch03:  t.slice(31, 35),
  ch04:  t.slice(22, 30),
  ch06:  t.slice(15, 21),
  ch08:  t.slice(8, 14),
  ch10:  t.slice(0, 7)
};
console.log('blocks: trans=' + B.trans.length + ' ch02=' + B.ch02.length + ' ch03=' + B.ch03.length + ' ch04=' + B.ch04.length + ' ch06=' + B.ch06.length + ' ch08=' + B.ch08.length + ' ch10=' + B.ch10.length);

function idxOf(sub) {
  const i = scope.findIndex(l => l.includes(sub));
  if (i < 0) fail('anchor not found: ' + sub);
  return i;
}

// [index to splice AT, block, label]
const ops = [
  [idxOf('<!-- SHARED MEDIA MODAL DIALOG') - 1, B.ch10, 'ch10 tail + </main>'],
  [idxOf('<!-- CHAPTER 09') - 1, B.ch08, 'ch08 motto + close'],
  [idxOf('<!-- CHAPTER 07') - 1, B.ch06, 'ch06 close'],
  [idxOf('<!-- CHAPTER 05') - 1, B.ch04, 'ch04 actions + close'],
  [idxOf('<!-- CHAPTER 04') - 1, B.ch03, 'ch03 close'],
  [idxOf('<!-- CHAPTER 03') - 1, B.ch02, 'ch02 close'],
  [idxOf('data-transition-num') + 1, B.trans, 'transition overlay close']
];

// Splice bottom-up so earlier indices stay valid.
ops.sort((a, b) => b[0] - a[0]);
const out = [...scope];
for (const [at, block, label] of ops) {
  console.log('  splice @' + at + '  ' + label);
  out.splice(at, 0, ...block);
}

fs.writeFileSync(path, out.join('\n'), 'utf8');
console.log('WROTE ' + out.length + ' lines (was ' + lines.length + ')');
