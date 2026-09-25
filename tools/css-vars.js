const fs = require('fs');
const files = ['css/variables.css','css/base.css','css/components.css','css/sections.css','css/responsive.css'];
let defined = new Set(), used = new Map();
for (const f of files) {
  const src = fs.readFileSync(f,'utf8');
  for (const m of src.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const m of src.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) {
    if (!used.has(m[1])) used.set(m[1], []);
    used.get(m[1]).push(f);
  }
}
const missing = [...used.keys()].filter(v => !defined.has(v));
console.log('defined tokens: ' + defined.size);
console.log('referenced tokens: ' + used.size);
if (missing.length === 0) console.log('ALL var() REFERENCES RESOLVED');
else { console.log('MISSING DEFINITIONS:'); missing.forEach(v => console.log('  ' + v + '  <- ' + [...new Set(used.get(v))].join(', '))); }
const unused = [...defined].filter(v => !used.has(v));
if (unused.length) console.log('defined-but-unused (informational): ' + unused.join(', '));
