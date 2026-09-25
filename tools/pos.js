const fs=require('fs');
const css=fs.readFileSync('css/components.css','utf8');
['.chapter-indicator {','.journey-rail {'].forEach(s=>{
  const i=css.indexOf(s);
  console.log('--- '+s);
  console.log(css.slice(i, css.indexOf('}', i)+1));
});
