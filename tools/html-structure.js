const fs = require('fs');
let src = fs.readFileSync('index.html','utf8');
// Collapse SVG subtrees so their internal tags do not confuse the HTML stack.
let svgCount = 0;
src = src.replace(/<svg[\s\S]*?<\/svg>/g, () => { svgCount++; return '<svg data-n="' + svgCount + '"></svg>'; });
const voidTags = new Set(['meta','link','img','br','hr','input','source','area','base','col','embed','track','wbr','!doctype']);
const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
const stack = [];
let line = 1, last = 0, m, problems = 0;
while ((m = re.exec(src))) {
  line += (src.slice(last, m.index).match(/\n/g) || []).length;
  last = re.lastIndex;
  const tag = m[1].toLowerCase();
  const isClose = m[0][1] === '/';
  const selfClose = m[3] === '/' || voidTags.has(tag);
  if (isClose) {
    if (!stack.length) { console.log('STRAY </' + tag + '> line ' + line); problems++; continue; }
    if (stack[stack.length-1].tag !== tag) {
      console.log('MISMATCH line ' + line + ': </' + tag + '> vs open <' + stack[stack.length-1].tag + '> line ' + stack[stack.length-1].line);
      problems++;
      let i = stack.length - 1;
      while (i >= 0 && stack[i].tag !== tag) i--;
      if (i >= 0) stack.length = i;
      continue;
    }
    stack.pop();
  } else if (!selfClose) {
    stack.push({ tag, line });
  }
}
stack.forEach(s => { console.log('UNCLOSED <' + s.tag + '> line ' + s.line); problems++; });
console.log('svg subtrees collapsed: ' + svgCount);
console.log(problems === 0 ? 'STRUCTURE OK' : 'PROBLEMS: ' + problems);
