// Backend measurements: cold start, RPS (oha), RSS idle/load, SSE concurrency CPU.
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

const OUT = __dirname + '/../results/backend-metrics.json';
const DEFS = JSON.parse(fs.readFileSync(__dirname + '/backend-defs.json', 'utf8'));
const targets = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function treePids(pid) {
  const byParent = {};
  for (const line of execSync('ps -e -o pid= -o ppid=').toString().trim().split('\n')) {
    const [p, pp] = line.trim().split(/\s+/);
    (byParent[pp] = byParent[pp] || []).push(p);
  }
  const out = [String(pid)];
  for (let i = 0; i < out.length; i++) for (const c of byParent[out[i]] || []) out.push(c);
  return out;
}
function rssMB(pid) {
  try {
    // sum RSS of process tree
    const pids = treePids(pid);
    let kb = 0;
    for (const p of pids) {
      try { kb += parseInt(fs.readFileSync(`/proc/${p}/status`, 'utf8').match(/VmRSS:\s+(\d+)/)[1], 10); } catch {}
    }
    return kb / 1024;
  } catch { return null; }
}
function cpuTicks(pid) {
  try {
    const pids = treePids(pid);
    let t = 0;
    for (const p of pids) {
      try { const s = fs.readFileSync(`/proc/${p}/stat`, 'utf8').split(' '); t += parseInt(s[13]) + parseInt(s[14]); } catch {}
    }
    return t;
  } catch { return null; }
}

function waitUp(port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/rows' }, (res) => { res.resume(); resolve(Date.now() - t0); });
      req.on('error', () => { if (Date.now() - t0 > timeoutMs) reject(new Error('timeout')); else setTimeout(poll, 20); });
    })();
  });
}

function openSSE(port, n) {
  const conns = [];
  for (let i = 0; i < n; i++) {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/events' }, (res) => res.resume());
    req.on('error', () => {});
    conns.push(req);
  }
  return conns;
}

(async () => {
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const name of targets) {
    const def = DEFS[name];
    if (!def) { console.log('no def', name); continue; }
    console.log('=== ' + name);
    try {
      const t0 = Date.now();
      const proc = spawn('bash', ['-c', def.cmd], { cwd: def.cwd, env: { ...process.env, PORT: String(def.port) }, stdio: 'ignore', detached: true });
      const coldMs = await waitUp(def.port);
      await sleep(1500);
      const idleMB = rssMB(proc.pid);
      // RPS via oha: 5s, 64 concurrent
      const oha = JSON.parse(execSync(`oha -z 5s -c 64 --no-tui --output-format json http://127.0.0.1:${def.port}/api/rows`, { maxBuffer: 1e8 }).toString());
      const rps = oha.summary.requestsPerSec;
      const p99 = oha.latencyPercentiles ? oha.latencyPercentiles.p99 : (oha.summary.p99 || null);
      const loadMB = rssMB(proc.pid);
      // SSE: 200 concurrent connections, measure CPU% over 10s
      const conns = openSSE(def.port, 200);
      await sleep(3000);
      const c0 = cpuTicks(proc.pid); const w0 = Date.now();
      await sleep(10000);
      const c1 = cpuTicks(proc.pid); const w1 = Date.now();
      const hz = 100; // USER_HZ
      const cpuPct = c0 != null && c1 != null ? ((c1 - c0) / hz) / ((w1 - w0) / 1000) * 100 : null;
      const sseMB = rssMB(proc.pid);
      conns.forEach((c) => c.destroy());
      try { process.kill(-proc.pid, 'SIGKILL'); } catch {}
      results[name] = { cold_start_ms: coldMs, rss_idle_mb: idleMB, rps: Math.round(rps), p99_ms: p99 ? Math.round(p99 * 1000 * 100) / 100 : null, rss_load_mb: loadMB, sse200_cpu_pct: cpuPct != null ? Math.round(cpuPct * 10) / 10 : null, rss_sse200_mb: sseMB, measured: true };
      console.log(name, JSON.stringify(results[name]));
    } catch (e) {
      console.log(name, 'FAILED', e.message);
      results[name] = { measured: false, error: e.message };
      try { execSync(`fuser -k ${def.port}/tcp 2>/dev/null`); } catch {}
    }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    await sleep(1000);
  }
})();
