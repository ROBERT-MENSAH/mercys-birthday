const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
// decorations.css must be included: the birthday-frame decoration classes
// (corners, balloons) are styled only there, so omitting it reported them
// as having no selector when they are in fact fully styled.
const css = ['css/base.css','css/components.css','css/decorations.css','css/sections.css','css/responsive.css'].map(f => fs.readFileSync(f,'utf8')).join('\n');
const classes = new Set();
for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
// Selectors only (text before each '{')
let selText = '';
for (const m of css.matchAll(/([^{}]+)\{/g)) selText += m[1] + ',';
const missing = [];
for (const c of classes) {
  const re = new RegExp('\\.' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_-])');
  if (!re.test(selText)) missing.push(c);
}
console.log('html classes: ' + classes.size);
console.log(missing.length ? 'NO CSS SELECTOR FOR:\n  ' + missing.join('\n  ') : 'every class has a real selector');
