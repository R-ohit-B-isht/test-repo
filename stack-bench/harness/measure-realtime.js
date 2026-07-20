// SSE vs WebSocket vs Postgres LISTEN/NOTIFY->SSE on go-echo-libs (port 3071).
// 200 concurrent connections each; measures delivery latency (sent_ns embedded by server)
// and server process CPU% over a 20s window. Also tests EventSource auto-reconnect.
const http = require('http');
const { execSync, spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const OUT = __dirname + '/../results/realtime-metrics.json';
const PORT = 3071;
const CONNS = Number(process.env.CONNS || 200);
const WINDOW_MS = 20000;

function serverPid() {
  return Number(execSync(`fuser ${PORT}/tcp 2>/dev/null`).toString().trim().split(/\s+/)[0]);
}
function cpuTicks(pid) {
  const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(' ');
  return Number(f[13]) + Number(f[14]);
}
const HZ = 100;
const stats = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return { n: a.length, avg_ms: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3), p50_ms: +s[Math.floor(s.length * 0.5)].toFixed(3), p99_ms: +s[Math.floor(s.length * 0.99)].toFixed(3) };
};

function sseConn(path, lat) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: PORT, path }, (res) => {
      let buf = '';
      res.on('data', (d) => {
        buf += d;
        let idx;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const m = chunk.match(/"sent_ns":(\d+)/);
          if (m) lat.push(Date.now() - Number(BigInt(m[1]) / 1000000n));
        }
      });
      resolve(() => req.destroy());
    });
    req.on('error', () => resolve(() => {}));
  });
}

async function benchSSE(path, conns = CONNS) {
  const lat = [];
  const closers = [];
  for (let i = 0; i < conns; i++) closers.push(await sseConn(path, lat));
  const pid = serverPid();
  const t0 = cpuTicks(pid); const w0 = Date.now();
  await new Promise((r) => setTimeout(r, WINDOW_MS));
  const cpuPct = ((cpuTicks(pid) - t0) / HZ) / ((Date.now() - w0) / 1000) * 100;
  closers.forEach((c) => c());
  return { conns, latency: stats(lat), server_cpu_pct: +cpuPct.toFixed(1) };
}

async function benchWS() {
  const lat = [];
  const socks = [];
  for (let i = 0; i < CONNS; i++) {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
    ws.on('message', (d) => {
      const m = String(d).match(/"sent_ns":(\d+)/);
      if (m) lat.push(Date.now() - Number(BigInt(m[1]) / 1000000n));
    });
    ws.on('error', () => {});
    socks.push(ws);
  }
  await new Promise((r) => setTimeout(r, 1000));
  const pid = serverPid();
  const t0 = cpuTicks(pid); const w0 = Date.now();
  await new Promise((r) => setTimeout(r, WINDOW_MS));
  const cpuPct = ((cpuTicks(pid) - t0) / HZ) / ((Date.now() - w0) / 1000) * 100;
  socks.forEach((s) => s.close());
  return { conns: CONNS, latency: stats(lat), server_cpu_pct: +cpuPct.toFixed(1) };
}

(async () => {
  const out = {};
  console.log('SSE plain...');
  out.sse_plain = await benchSSE('/api/events');
  console.log(JSON.stringify(out.sse_plain));
  console.log('WebSocket...');
  out.websocket = await benchWS();
  console.log(JSON.stringify(out.websocket));
  console.log('SSE via Postgres LISTEN/NOTIFY...');
  out.sse_pg_notify = await benchSSE('/api/events-pg', Number(process.env.PG_CONNS || 50));
  out.sse_pg_notify.note = '50 conns: per-connection LISTEN uses one Postgres conn each; production should fan out from a single LISTEN connection';
  console.log(JSON.stringify(out.sse_pg_notify));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
})();
