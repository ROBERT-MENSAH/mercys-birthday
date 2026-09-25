const fs = require('fs');
const files = ['css/variables.css','css/base.css','css/components.css','css/decorations.css','css/sections.css','css/responsive.css'];
let problems = 0;
for (const f of files) {
  const lines = fs.readFileSync(f,'utf8').split(/\r?\n/);
  const stack = [];          // {isAtRule}
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\{/g)||[]).length;
    const closes = (line.match(/\}/g)||[]).length;
    const trimmed = line.trim();
    const looksLikeSel = /\{\s*$/.test(trimmed) && !/^--?[a-z]/.test(trimmed) && !/[;{]\s*[a-z-]+\s*:/.test(trimmed);
    if (looksLikeSel && stack.length > 0 && !stack.some(s => s.isAtRule)) {
      console.log('NESTED SELECTOR ' + f + ':' + (i+1) + '  ' + trimmed.slice(0,60)); problems++;
    }
    const isAtRule = /^@[a-z-]+/.test(trimmed);
    for (let k = 0; k < opens; k++) stack.push({ isAtRule });
    for (let k = 0; k < closes; k++) {
      if (!stack.length) { console.log('EXTRA } ' + f + ':' + (i+1)); problems++; }
      else stack.pop();
    }
    // declaration at depth 0 (outside any block)
    if (stack.length === 0 && /^[a-z-]+\s*:[^;{}]+;\s*$/.test(trimmed)) {
      console.log('ORPHAN DECL ' + f + ':' + (i+1) + '  ' + trimmed.slice(0,60)); problems++;
    }
  }
  if (stack.length) { console.log('UNCLOSED BLOCK in ' + f + ' (depth ' + stack.length + ')'); problems++; }
}
console.log(problems === 0 ? 'CSS VALID: no nested selectors, no orphans, all blocks closed' : 'PROBLEMS: ' + problems);
