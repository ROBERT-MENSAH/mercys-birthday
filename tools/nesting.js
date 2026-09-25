const fs = require('fs');
const lines = fs.readFileSync('css/sections.css','utf8').split(/\r?\n/);
let depth = 0;
const bad = [];
lines.forEach((line, i) => {
  const isSel = /^\s*[.&#a-zA-Z\[\]:*][^;]*\{\s*$/.test(line) && !/^\s*(--|[a-z-]+\s*:)/.test(line);
  if (isSel && depth > 0) bad.push({ line: i+1, depth, text: line });
  depth += (line.match(/\{/g)||[]).length - (line.match(/\}/g)||[]).length;
});
console.log('selectors appearing at depth > 0: ' + bad.length);
bad.slice(0, 60).forEach(b => console.log('  d=' + b.depth + '  L' + b.line + '  ' + b.text.trim().slice(0,70)));
