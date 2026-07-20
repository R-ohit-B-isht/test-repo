// Minimal meta-framework implementations (static/SPA output, served from /fe/<name>/).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'frontends');
function w(rel, c) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); }

const SHARED = fs.readFileSync(path.join(ROOT, 'vanilla', 'src', 'shared.js'), 'utf8');
const REACT_TABLE = `import {useState,useEffect} from 'react';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
export default function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return (<div><button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
  <table><tbody><tr>{COLS.map(c=><th key={c} onClick={()=>{setDir(key===c?-dir:1);setKey(c);}}>{c}</th>)}</tr>
  {sorted.map(r=><tr key={r.id}>{COLS.map(c=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table></div>);
}`;

// ---------- Next.js (static export, SPA-ish) ----------
w('next/package.json', JSON.stringify({ name: 'fe-next', private: true, scripts: { build: 'next build' }, dependencies: { next: '15.1.3', react: '^18.3.1', 'react-dom': '^18.3.1' } }, null, 2));
w('next/next.config.js', `module.exports={output:'export',basePath:'/fe/next',distDir:'dist-next'};`);
w('next/app/layout.js', `export const metadata={title:'next CEO console'};
export default function RootLayout({children}){return <html><body style={{fontFamily:'system-ui',background:'#111',color:'#eee'}}>{children}</body></html>;}`);
w('next/app/page.js', `'use client';
import Table from './table';
export default function Page(){return <div><h1>next console</h1><Table/></div>;}`);
w('next/app/table.js', `'use client';\n` + REACT_TABLE);
w('next/app/shared.js', SHARED);

// ---------- React Router 7 (SPA mode == modern Remix) ----------
w('react-router/package.json', JSON.stringify({ name: 'fe-react-router', private: true, type: 'module', scripts: { build: 'react-router build' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router': '^7.1.1', '@react-router/node': '^7.1.1' }, devDependencies: { '@react-router/dev': '^7.1.1', vite: '^6.0.0' } }, null, 2));
w('react-router/react-router.config.js', `export default {ssr:false,basename:'/fe/react-router'};`);
w('react-router/vite.config.js', `import {reactRouter} from '@react-router/dev/vite';export default {base:'/fe/react-router/',plugins:[reactRouter()]};`);
w('react-router/app/routes.js', `import {index} from '@react-router/dev/routes';export default [index('./home.jsx')];`);
w('react-router/app/root.jsx', `import {Outlet,Scripts} from 'react-router';
export default function Root(){return <html><head><title>react-router CEO console</title></head><body style={{fontFamily:'system-ui',background:'#111',color:'#eee'}}><Outlet/><Scripts/></body></html>;}
export function HydrateFallback(){return <p>loading</p>;}`);
w('react-router/app/home.jsx', `import Table from './table.jsx';export default function Home(){return <div><h1>react-router console</h1><Table/></div>;}`);
w('react-router/app/table.jsx', REACT_TABLE);
w('react-router/app/shared.js', SHARED);

// ---------- SvelteKit (static SPA) ----------
w('sveltekit/package.json', JSON.stringify({ name: 'fe-sveltekit', private: true, type: 'module', scripts: { build: 'vite build' }, devDependencies: { '@sveltejs/kit': '^2.15.1', '@sveltejs/adapter-static': '^3.0.8', '@sveltejs/vite-plugin-svelte': '^5.0.0', svelte: '^5.16.0', vite: '^6.0.0' } }, null, 2));
w('sveltekit/svelte.config.js', `import adapter from '@sveltejs/adapter-static';
export default {kit:{adapter:adapter({fallback:'index.html'}),paths:{base:'/fe/sveltekit'}}};`);
w('sveltekit/vite.config.js', `import {sveltekit} from '@sveltejs/kit/vite';export default {plugins:[sveltekit()]};`);
w('sveltekit/src/app.html', `<!doctype html><html><head><meta charset="utf-8">%sveltekit.head%</head><body style="font-family:system-ui;background:#111;color:#eee">%sveltekit.body%</body></html>`);
w('sveltekit/src/routes/+layout.js', `export const ssr=false;export const prerender=false;`);
w('sveltekit/src/routes/+page.svelte', `<script>
import {COLS,getN,sortRows,wireCommon,markReady} from '$lib/shared.js';
import {onMount} from 'svelte';
let rows=$state([]);let key=$state('id');let dir=$state(1);
onMount(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows=rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
let sorted=$derived(sortRows(rows,key,dir));
</script>
<h1>sveltekit console</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<table><tbody><tr>{#each COLS as c}<th onclick={()=>{dir=key===c?-dir:1;key=c;}}>{c}</th>{/each}</tr>
{#each sorted as r (r.id)}<tr>{#each COLS as c}<td>{r[c]}</td>{/each}</tr>{/each}</tbody></table>`);
w('sveltekit/src/lib/shared.js', SHARED);

// ---------- Astro (static + vanilla island) ----------
w('astro/package.json', JSON.stringify({ name: 'fe-astro', private: true, type: 'module', scripts: { build: 'astro build' }, dependencies: { astro: '^5.1.1' } }, null, 2));
w('astro/astro.config.mjs', `import {defineConfig} from 'astro/config';export default defineConfig({base:'/fe/astro',outDir:'dist'});`);
w('astro/src/pages/index.astro', `---
---
<html><head><title>astro CEO console</title></head>
<body style="font-family:system-ui;background:#111;color:#eee">
<h1>astro console</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<div id="app"></div>
<script>
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
let rows=[],key='id',dir=1;const app=document.getElementById('app');
function render(){const t=document.createElement('table');const tb=document.createElement('tbody');const tr=document.createElement('tr');
COLS.forEach(c=>{const th=document.createElement('th');th.textContent=c;th.onclick=()=>{dir=key===c?-dir:1;key=c;rows=sortRows(rows,key,dir);render();};tr.appendChild(th);});
tb.appendChild(tr);for(const r of rows){const tr2=document.createElement('tr');COLS.forEach(c=>{const td=document.createElement('td');td.textContent=String(r[c]);tr2.appendChild(td);});tb.appendChild(tr2);}
t.appendChild(tb);app.replaceChildren(t);}
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;render();markReady();});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;render();}});
</script>
</body></html>`);
w('astro/src/shared.js', SHARED);

// ---------- Qwik ----------
w('qwik/package.json', JSON.stringify({ name: 'fe-qwik', private: true, type: 'module', scripts: { build: 'vite build' }, devDependencies: { '@builder.io/qwik': '^1.12.0', vite: '^6.0.0', typescript: '^5.7.2' } }, null, 2));
w('qwik/vite.config.ts', `import {defineConfig} from 'vite';import {qwikVite} from '@builder.io/qwik/optimizer';
export default defineConfig({base:'/fe/qwik/',plugins:[qwikVite({csr:true})]});`);
w('qwik/index.html', `<!doctype html><html><head><meta charset="utf-8"><title>qwik CEO console</title></head>
<body style="font-family:system-ui;background:#111;color:#eee">
<h1>qwik console</h1><button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<div id="app"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
w('qwik/src/main.tsx', `import {render} from '@builder.io/qwik';
import {component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
const Table = component$(() => {
  const rows = useSignal<any[]>([]); const key = useSignal('id'); const dir = useSignal(1);
  useVisibleTask$(() => {
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
    wireCommon((ev:any)=>{rows.value=rows.value.map((r:any)=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});
  });
  const sorted = sortRows(rows.value, key.value, dir.value);
  return <table><tbody><tr>{COLS.map((c:string)=><th key={c} onClick$={()=>{dir.value=key.value===c?-dir.value:1;key.value=c;}}>{c}</th>)}</tr>
  {sorted.map((r:any)=><tr key={r.id}>{COLS.map((c:string)=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table>;
});
render(document.getElementById('app')!, <Table/>);`);
w('qwik/src/shared.js', SHARED);
w('qwik/tsconfig.json', JSON.stringify({ compilerOptions: { jsx: 'react-jsx', jsxImportSource: '@builder.io/qwik', target: 'ES2020', module: 'ESNext', moduleResolution: 'bundler', allowJs: true, skipLibCheck: true, strict: false } }, null, 2));

// ---------- Angular ----------
// generated separately via ng CLI (see build script)

// ---------- Nuxt (SPA, static) ----------
w('nuxt/package.json', JSON.stringify({ name: 'fe-nuxt', private: true, type: 'module', scripts: { build: 'nuxt generate' }, dependencies: { nuxt: '^3.15.0', vue: '^3.5.13' } }, null, 2));
w('nuxt/nuxt.config.ts', `export default defineNuxtConfig({ssr:false,app:{baseURL:'/fe/nuxt/'},nitro:{output:{publicDir:'dist'}}});`);
w('nuxt/app.vue', `<template><div style="font-family:system-ui;background:#111;color:#eee">
<h1>nuxt console</h1><button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<table><tbody><tr><th v-for="c in COLS" :key="c" @click="sortBy(c)">{{c}}</th></tr>
<tr v-for="r in sorted" :key="r.id"><td v-for="c in COLS" :key="c">{{r[c]}}</td></tr></tbody></table></div></template>
<script setup>
import {ref,computed,onMounted} from 'vue';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
const rows=ref([]),key=ref('id'),dir=ref(1);
onMounted(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.value=rows.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
function sortBy(c){dir.value=key.value===c?-dir.value:1;key.value=c;}
const sorted=computed(()=>sortRows(rows.value,key.value,dir.value));
</script>`);
w('nuxt/shared.js', SHARED);

// ---------- SolidStart ----------
w('solidstart/package.json', JSON.stringify({ name: 'fe-solidstart', private: true, type: 'module', scripts: { build: 'vinxi build' }, dependencies: { '@solidjs/start': '^1.0.11', 'solid-js': '^1.9.3', vinxi: '^0.5.1' } }, null, 2));
w('solidstart/app.config.js', `import {defineConfig} from '@solidjs/start/config';
export default defineConfig({ssr:false,server:{baseURL:'/fe/solidstart',static:true,prerender:{routes:['/']}}});`);
w('solidstart/src/app.jsx', `import {createSignal,createMemo,onMount,For} from 'solid-js';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
export default function App(){const [rows,setRows]=createSignal([]);const [key,setKey]=createSignal('id');const [dir,setDir]=createSignal(1);
onMount(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));});
const sorted=createMemo(()=>sortRows(rows(),key(),dir()));
return <div style="font-family:system-ui;background:#111;color:#eee"><h1>solidstart console</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<table><tbody><tr><For each={COLS}>{c=><th onClick={()=>{setDir(key()===c?-dir():1);setKey(c);}}>{c}</th>}</For></tr>
<For each={sorted()}>{r=><tr><For each={COLS}>{c=><td>{String(r[c])}</td>}</For></tr>}</For></tbody></table></div>;}`);
w('solidstart/src/entry-client.jsx', `import {mount, StartClient} from '@solidjs/start/client';mount(()=><StartClient/>,document.getElementById('app'));`);
w('solidstart/src/entry-server.jsx', `import {createHandler, StartServer} from '@solidjs/start/server';
export default createHandler(()=><StartServer document={({assets,children,scripts})=>(<html><head><title>solidstart</title>{assets}</head><body><div id="app">{children}</div>{scripts}</body></html>}/>);`);
w('solidstart/src/shared.js', SHARED);

console.log('generated meta frontends');
