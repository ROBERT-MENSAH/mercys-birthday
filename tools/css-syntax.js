const fs = require('fs');
const files = ['css/variables.css','css/base.css','css/components.css','css/sections.css','css/responsive.css'];
for (const f of files) {
  const lines = fs.readFileSync(f,'utf8').split(/\r?\n/);
  let depth = 0, inComment = false;
  lines.forEach((raw, i) => {
    let line = raw;
    // crude comment tracking
    if (inComment) { const e = line.indexOf('*/'); if (e < 0) return; line = line.slice(e+2); inComment = false; }
    const cs = line.indexOf('/*');
    if (cs >= 0) { const ce = line.indexOf('*/', cs); if (ce < 0) { inComment = true; line = line.slice(0, cs); } else { line = line.slice(0, cs) + line.slice(ce+2); } }
    const stripped = line.replace(/"[^"]*"|'[^']*'/g, '');
    if (depth === 0 && /[-a-zA-Z]\s*:/.test(stripped) && !/@(media|supports|keyframes|import|charset|font-face|layer|container|property)/.test(stripped)) {
      console.log(f + ':' + (i+1) + '  ORPHAN DECLARATION  ' + line.trim());
    }
    if (depth === 0 && !/@/.test(stripped) && /\{/.test(stripped) && !/[-.#:a-zA-Z]/.test(stripped)) {
      console.log(f + ':' + (i+1) + '  EMPTY SELECTOR  ' + line.trim());
    }
    for (const ch of stripped) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth < 0) { console.log(f + ':' + (i+1) + '  UNBALANCED }'); depth = 0; } } }
  });
  if (depth !== 0) console.log(f + '  ENDS AT DEPTH ' + depth);
}
console.log('scan complete');
