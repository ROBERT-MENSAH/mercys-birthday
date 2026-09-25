const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const c=html.indexOf('chapter-actions');
console.log('--- CHAPTER ACTIONS ---'); console.log(html.slice(c-260, c+700));
const f=html.indexOf('vault-filter-btn');
console.log('\n--- FILTERS ---'); console.log(html.slice(f-300, f+560));
