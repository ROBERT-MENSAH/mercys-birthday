const fs=require('fs');
const css=fs.readFileSync('css/sections.css','utf8')+fs.readFileSync('css/components.css','utf8')+fs.readFileSync('css/base.css','utf8')+fs.readFileSync('css/responsive.css','utf8');
console.log('focus-visible rules:', (css.match(/:focus-visible/g)||[]).length);
console.log('::selection rules  :', (css.match(/::selection/g)||[]).length);
console.log('scrollbar rules    :', (css.match(/scrollbar-/g)||[]).length);
const sels=['.friend-story-card','.parent-editorial-card','.sibling-portrait-unit','.vault-filter-btn','.btn svg','.btn:hover svg','.eyebrow::before'];
sels.forEach(s=>{ const re=new RegExp('(^|\\n)\\s*'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[,{]','m'); console.log((re.test(css)?'YES ':'no  ')+s); });
