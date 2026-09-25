const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
// gallery block
const g=html.indexOf('data-gallery-grid');
console.log('--- GALLERY MARKUP (first card) ---');
console.log(html.slice(g, g+1100));
