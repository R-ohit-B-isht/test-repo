// Disk-cached HTTP fetch for maker sites. Cache lives outside the repo (~/gear/cache) and is keyed by URL.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CACHE = process.env.GEAR_CACHE || path.join(process.env.HOME || '', 'gear', 'cache');
fs.mkdirSync(CACHE, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const key = (u) => u.replace(/[^a-z0-9]+/gi, '_').slice(0, 180);

export function fetchText(url, { ttlMs = 30 * 864e5 } = {}) {
  const f = path.join(CACHE, key(url) + '.txt');
  if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs < ttlMs) return fs.readFileSync(f, 'utf8');
  let body = '';
  try {
    body = execFileSync('curl', ['-sL', '-m', '45', '-A', UA, '--compressed', url], { maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch {
    body = '';
  }
  if (body) fs.writeFileSync(f, body);
  return body;
}

export function fetchJson(url, opts) {
  try {
    return JSON.parse(fetchText(url, opts));
  } catch {
    return null;
  }
}

export const today = () => new Date().toISOString().slice(0, 10);
