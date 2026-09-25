const fs=require('fs');
const html=fs.readFileSync('index.html','body'.length?'utf8':'utf8');
const i=html.indexOf('id="media-modal"');
console.log(html.slice(i-60, html.indexOf('</dialog>',i)+9));
