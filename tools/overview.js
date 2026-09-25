const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const m=[...html.matchAll(/<section[^>]*class="([^"]+)"[^>]*id="([^"]+)"/g)];
console.log('SECTIONS:'); m.forEach(x=>console.log('  '+x[2].padEnd(26)+x[1]));
const h2=[...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(x=>x[1].replace(/<[^>]+>/g,'').trim());
console.log('\nH2 HEADINGS ('+h2.length+'):'); h2.forEach(t=>console.log('  '+t));
const btn=[...html.matchAll(/<button[^>]*class="([^"]+)"/g)].map(x=>x[1]);
console.log('\nBUTTON CLASSES:'); [...new Set(btn)].forEach(t=>console.log('  '+t));
