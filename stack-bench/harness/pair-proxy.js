// Serves the Astro build statically and proxies /api/* to a target backend port.
// Usage: node pair-proxy.js <backendPort> [listenPort=4100]
const http = require('http');
const fs = require('fs');
const path = require('path');

const target = Number(process.argv[2]);
const listen = Number(process.argv[3] || 4100);
const ROOT = path.join(__dirname, '..', 'frontends', 'astro', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    const preq = http.request({ host: '127.0.0.1', port: target, path: req.url, method: req.method, headers: { ...req.headers, host: '127.0.0.1:' + target } }, (pres) => {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    });
    preq.on('error', () => { res.writeHead(502); res.end('bad gateway'); });
    req.pipe(preq);
    return;
  }
  let p = u.pathname.replace(/^\/fe\/astro/, '') || '/';
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(listen, () => console.log('proxy up', listen, '->', target));
