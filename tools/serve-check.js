const http = require('http');
const fs = require('fs');
const path = require('path');
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(process.cwd(), p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
const targets = ['/', '/css/variables.css', '/css/base.css', '/css/components.css', '/css/decorations.css', '/css/sections.css', '/css/responsive.css', '/js/data.js', '/js/main.js'];
function get(p) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: 8081, path: p, agent: false }, res => {
      let n = 0; res.on('data', c => n += c.length);
      res.on('end', () => resolve({ status: res.statusCode, bytes: n }));
    });
    req.on('error', reject);
  });
}
server.listen(8081, '127.0.0.1', async () => {
  let fail = 0, ok = 0;
  for (const t of targets) {
    try {
      const r = await get(t);
      if (r.status === 200 && r.bytes > 0) { ok++; console.log('  PASS  ' + r.status + '  ' + t); }
      else { fail++; console.log('  FAIL  ' + r.status + '  ' + t); }
    } catch (e) { fail++; console.log('  FAIL  ' + t + ' ' + e.message); }
  }
  console.log(fail ? 'SERVE CHECK FAILED [' + fail + ']' : 'SERVE CHECK PASSED  [' + ok + '/' + targets.length + ' routes, HTTP 200]');
  process.exitCode = fail ? 1 : 0;
  server.close();   // no active sockets remain (agent:false), so the loop drains naturally
});
