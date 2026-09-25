const fs = require('fs');
const lines = fs.readFileSync('css/sections.css','utf8').split(/\r?\n/);
function prevNonBlank(i) { for (let j = i-1; j >= 0; j--) if (lines[j].trim() !== '') return { i: j, text: lines[j] }; return null; }
const decl = /^[a-z-]+\s*:[^;{}]*;\s*$/;
console.log('=== SITES: section comment preceded by a declaration (missing }) ===');
lines.forEach((l, i) => {
  if (/^\/\*\s*-+\s*CHAPTER/.test(l.trim())) {
    const p = prevNonBlank(i);
    if (p && decl.test(p.text.trim())) console.log('  comment L' + (i+1) + '  <- rule decl at L' + (p.i+1) + ': ' + p.text.trim());
    else if (p && !/^\s*}\s*$/.test(p.text)) console.log('  comment L' + (i+1) + '  <- UNEXPECTED prev: ' + p.text.trim());
  }
});
console.log('\n=== all top-level section comments ===');
lines.forEach((l, i) => { if (/^\/\*\s*-+\s*CHAPTER/.test(l.trim())) console.log('  L' + (i+1) + ': ' + l.trim().slice(0, 70)); });
