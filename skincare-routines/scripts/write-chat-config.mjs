#!/usr/bin/env node
/** Deploy-time step for browser mode: writes dist/chat-config.json with the Gemini key taken from the environment so the
 * key is never committed. The key ships to visitors' browsers — it MUST be restricted in Google AI Studio to the site's
 * HTTP referrer (e.g. https://skincare-routines-vloimvmn.devinapps.com/*) before use.
 *
 *   GEMINI_API_KEY=… SITE_URL=https://… node scripts/write-chat-config.mjs [dist-dir]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const key = process.env.GEMINI_API_KEY ?? '';
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!key) { console.error('GEMINI_API_KEY is not set — refusing to write a browser-mode config without a key.'); process.exit(1); }
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error(`${dist}/index.html not found — run \`npm run build\` first.`); process.exit(1); }

const config = {
  mode: 'browser',
  apiBase: '',
  siteUrl,
  gemini: { apiKey: key, model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash', maxToolRounds: 8, maxAnswerTokens: 1800 },
};
fs.writeFileSync(path.join(dist, 'chat-config.json'), `${JSON.stringify(config, null, 2)}\n`);
console.log(`wrote ${path.join(dist, 'chat-config.json')} (mode=browser, model=${config.gemini.model}, key=${key.slice(0, 6)}…${key.slice(-4)}, siteUrl=${siteUrl || '(same origin)'})`);
