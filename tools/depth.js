const fs = require('fs');
const lines = fs.readFileSync('css/sections.css','utf8').split(/\r?\n/);
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  if (i+1 >= 285 && i+1 <= 300) console.log(String(i+1).padStart(4) + ' d=' + depth + ' | ' + line);
  if (i+1 >= 1130 && i+1 <= 1170) console.log(String(i+1).padStart(4) + ' d=' + depth + ' | ' + line);
  depth += opens - closes;
  if (i+1 === 1142 || i+1 === 1117 || i+1 === 1092 || i+1 === 1068 || i+1 === 1045) console.log(String(i+1).padStart(4) + ' d=' + depth + ' | (after line) ' + line);
}
