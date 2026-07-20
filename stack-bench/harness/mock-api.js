// Shared mock API server (BENCHMARK HARNESS ONLY — not a product).
// Serves the reference workload endpoints + built frontend bundles.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FE_ROOT = path.join(__dirname, '..', 'frontends');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.map': 'application/json', '.txt': 'text/plain', '.woff2': 'font/woff2' };

function makeRow(i) {
  return { id: i, service: `svc-${i % 12}`, region: ['us-east', 'us-west', 'eu-central'][i % 3], status: ['ok', 'warn', 'err'][i % 3], latency_ms: 20 + ((i * 37) % 400), rps: 100 + ((i * 91) % 5000), updated_at: new Date(1752900000000 + i * 1000).toISOString() };
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (u.pathname === '/api/rows') {
    const n = Math.min(parseInt(u.searchParams.get('n') || '200', 10), 50000);
    const rows = Array.from({ length: n }, (_, i) => makeRow(i));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(rows));
  }
  if (u.pathname === '/api/action' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, received: body.length, ts: Date.now() }));
    });
    return;
  }
  if (u.pathname === '/api/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    let i = 0;
    const t = setInterval(() => {
      const ev = { seq: i, row_id: i % 200, latency_ms: 20 + ((i * 53) % 400), status: ['ok', 'warn', 'err'][i % 3], msg: `event ${i}`, ts: Date.now() };
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
      i++;
    }, 100); // 10 events/sec
    req.on('close', () => clearInterval(t));
    return;
  }
  // static frontends: /fe/<name>/...
  const m = u.pathname.match(/^\/fe\/([\w.-]+)(\/.*)?$/);
  if (m) {
    const distDir = path.join(FE_ROOT, m[1], 'dist');
    let p = m[2] && m[2] !== '/' ? m[2] : '/index.html';
    let file = path.join(distDir, p);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(404); res.end('nf');
});
const port = process.env.PORT || 4000;
server.listen(port, () => console.log('mock api on :' + port));
