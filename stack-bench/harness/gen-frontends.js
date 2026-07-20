// Generates minimal, equivalent frontend implementations (benchmark harness).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'frontends');

const HTML = (title, entry, extraHead = '') => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title} CEO console</title>${extraHead}
<style>body{font-family:system-ui;background:#111;color:#eee;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #333;padding:2px 6px;font-size:12px}th{cursor:pointer}#feed li{font-size:12px}</style>
</head><body>
<h1>${title} console</h1>
<button id="act">Run action</button> <span id="actres"></span>
<ul id="feed"></ul>
<div id="app"></div>
${entry}
</body></html>`;

// Shared imperative helpers used by vanilla-ish variants
const SHARED_JS = `
export const COLS = ['id','service','region','status','latency_ms','rps','updated_at'];
export function getN(){ return parseInt(new URLSearchParams(location.search).get('n')||'200',10); }
export function sortRows(rows, key, dir){ return [...rows].sort((a,b)=> (a[key]>b[key]?1:a[key]<b[key]?-1:0)*dir); }
export function wireCommon(onEvent){
  const feed=document.getElementById('feed');
  const es=new EventSource('/api/events');
  es.onmessage=(e)=>{ const ev=JSON.parse(e.data);
    const li=document.createElement('li'); li.textContent=ev.seq+' '+ev.status+' '+ev.msg;
    feed.prepend(li); while(feed.children.length>20) feed.lastChild.remove();
    onEvent&&onEvent(ev); };
  document.getElementById('act').onclick=async()=>{
    const r=await fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cmd:'restart'})});
    document.getElementById('actres').textContent=JSON.stringify(await r.json()); };
}
export function markReady(){ window.__benchReady=true; window.__tableRenderedAt=performance.now(); }
`;

function proj(name, files, pkg) {
  const dir = path.join(ROOT, name);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fe-' + name, private: true, type: 'module', scripts: { build: 'vite build --base=/fe/' + name + '/' }, ...pkg }, null, 2));
  for (const [f, c] of Object.entries(files)) {
    const p = path.join(dir, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c);
  }
  fs.writeFileSync(path.join(dir, 'src', 'shared.js'), SHARED_JS);
}

// ---------- vanilla ----------
proj('vanilla', {
  'index.html': HTML('vanilla', '<script type="module" src="/src/main.js"></script>'),
  'src/main.js': `import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;const app=document.getElementById('app');
function render(){const t=document.createElement('table');const tr=document.createElement('tr');
COLS.forEach(c=>{const th=document.createElement('th');th.textContent=c;th.onclick=()=>{dir=key===c?-dir:1;key=c;rows=sortRows(rows,key,dir);render();};tr.appendChild(th);});
t.appendChild(tr);for(const r of rows){const tr2=document.createElement('tr');COLS.forEach(c=>{const td=document.createElement('td');td.textContent=r[c];tr2.appendChild(td);});t.appendChild(tr2);}
app.replaceChildren(t);}
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;render();markReady();});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;render();}});`
}, { devDependencies: { vite: '^6.0.0' } });

// ---------- react / preact / inferno share JSX-ish code ----------
const REACT_APP = (imp, renderCall) => `${imp}
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return h('table',null,[h('tr',{key:'h'},COLS.map(c=>h('th',{key:c,onClick:()=>{setDir(key===c?-dir:1);setKey(c);}},c))),
    sorted.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))]);
}
${renderCall}`;

proj('react', {
  'index.html': HTML('react', '<script type="module" src="/src/main.jsx"></script>'),
  'src/main.jsx': REACT_APP(
    `import {useState,useEffect,createElement as h} from 'react';import {createRoot} from 'react-dom/client';`,
    `createRoot(document.getElementById('app')).render(h(Table));`)
}, { dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' }, devDependencies: { vite: '^6.0.0' } });

proj('preact', {
  'index.html': HTML('preact', '<script type="module" src="/src/main.jsx"></script>'),
  'src/main.jsx': REACT_APP(
    `import {h,render} from 'preact';import {useState,useEffect} from 'preact/hooks';`,
    `render(h(Table),document.getElementById('app'));`)
}, { dependencies: { preact: '^10.25.0' }, devDependencies: { vite: '^6.0.0' } });

proj('inferno', {
  'index.html': HTML('inferno', '<script type="module" src="/src/main.jsx"></script>'),
  'src/main.jsx': REACT_APP(
    `import {render} from 'inferno';import {createElement as h} from 'inferno-create-element';import {useState,useEffect} from 'inferno-hooks';`,
    `render(h(Table),document.getElementById('app'));`)
}, { dependencies: { inferno: '^8.2.3', 'inferno-create-element': '^8.2.3', 'inferno-hooks': '^0.2.4' }, devDependencies: { vite: '^6.0.0' } });

// ---------- vue ----------
proj('vue', {
  'index.html': HTML('vue', '<script type="module" src="/src/main.js"></script>'),
  'src/main.js': `import {createApp,ref,computed,onMounted,h} from 'vue';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
createApp({setup(){const rows=ref([]),key=ref('id'),dir=ref(1);
onMounted(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.value=rows.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
const sorted=computed(()=>sortRows(rows.value,key.value,dir.value));
return ()=>h('table',[h('tr',COLS.map(c=>h('th',{onClick:()=>{dir.value=key.value===c?-dir.value:1;key.value=c;}},c))),
sorted.value.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',String(r[c])))))]);}}).mount('#app');`
}, { dependencies: { vue: '^3.5.13' }, devDependencies: { vite: '^6.0.0' } });

// ---------- svelte 5 ----------
proj('svelte', {
  'index.html': HTML('svelte', '<script type="module" src="/src/main.js"></script>'),
  'vite.config.js': `import {svelte} from '@sveltejs/vite-plugin-svelte';export default {plugins:[svelte()]};`,
  'src/main.js': `import {mount} from 'svelte';import App from './App.svelte';mount(App,{target:document.getElementById('app')});`,
  'src/App.svelte': `<script>
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=$state([]);let key=$state('id');let dir=$state(1);
$effect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows=rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
let sorted=$derived(sortRows(rows,key,dir));
</script>
<table><tr>{#each COLS as c}<th onclick={()=>{dir=key===c?-dir:1;key=c;}}>{c}</th>{/each}</tr>
{#each sorted as r (r.id)}<tr>{#each COLS as c}<td>{r[c]}</td>{/each}</tr>{/each}</table>`
}, { dependencies: { svelte: '^5.16.0' }, devDependencies: { vite: '^6.0.0', '@sveltejs/vite-plugin-svelte': '^5.0.0' } });

// ---------- solid ----------
proj('solid', {
  'index.html': HTML('solid', '<script type="module" src="/src/main.jsx"></script>'),
  'vite.config.js': `import solid from 'vite-plugin-solid';export default {plugins:[solid()]};`,
  'src/main.jsx': `import {render} from 'solid-js/web';import {createSignal,createMemo,onMount,For} from 'solid-js';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
function Table(){const [rows,setRows]=createSignal([]);const [key,setKey]=createSignal('id');const [dir,setDir]=createSignal(1);
onMount(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));});
const sorted=createMemo(()=>sortRows(rows(),key(),dir()));
return <table><tr><For each={COLS}>{c=><th onClick={()=>{setDir(key()===c?-dir():1);setKey(c);}}>{c}</th>}</For></tr>
<For each={sorted()}>{r=><tr><For each={COLS}>{c=><td>{String(r[c])}</td>}</For></tr>}</For></table>;}
render(()=>a<Table/>,document.getElementById('app'));`.replace('a<Table/>', '<Table/>')
}, { dependencies: { 'solid-js': '^1.9.3' }, devDependencies: { vite: '^6.0.0', 'vite-plugin-solid': '^2.11.0' } });

// ---------- lit ----------
proj('lit', {
  'index.html': HTML('lit', '<script type="module" src="/src/main.js"></script>'),
  'src/main.js': `import {LitElement,html} from 'lit';import {repeat} from 'lit/directives/repeat.js';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
class BenchTable extends LitElement{
static properties={rows:{state:true},key:{state:true},dir:{state:true}};
createRenderRoot(){return this;}
constructor(){super();this.rows=[];this.key='id';this.dir=1;}
connectedCallback(){super.connectedCallback();
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{this.rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{this.rows=this.rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});}
render(){const sorted=sortRows(this.rows,this.key,this.dir);
return html\`<table><tr>\${COLS.map(c=>html\`<th @click=\${()=>{this.dir=this.key===c?-this.dir:1;this.key=c;}}>\${c}</th>\`)}</tr>
\${repeat(sorted,r=>r.id,r=>html\`<tr>\${COLS.map(c=>html\`<td>\${r[c]}</td>\`)}</tr>\`)}</table>\`;}}
customElements.define('bench-table',BenchTable);
document.getElementById('app').appendChild(document.createElement('bench-table'));`
}, { dependencies: { lit: '^3.2.1' }, devDependencies: { vite: '^6.0.0' } });

// ---------- mithril ----------
proj('mithril', {
  'index.html': HTML('mithril', '<script type="module" src="/src/main.js"></script>'),
  'src/main.js': `import m from 'mithril';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;
const Table={view:()=>m('table',[m('tr',COLS.map(c=>m('th',{onclick:()=>{dir=key===c?-dir:1;key=c;}},c))),
sortRows(rows,key,dir).map(r=>m('tr',{key:r.id},COLS.map(c=>m('td',String(r[c])))))])};
m.mount(document.getElementById('app'),Table);
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;m.redraw();requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;m.redraw();}});`
}, { dependencies: { mithril: '^2.2.11' }, devDependencies: { vite: '^6.0.0' } });

// ---------- vanjs ----------
proj('vanjs', {
  'index.html': HTML('vanjs', '<script type="module" src="/src/main.js"></script>'),
  'src/main.js': `import van from 'vanjs-core';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
const {table,tr,th,td}=van.tags;
const rows=van.state([]),key=van.state('id'),dir=van.state(1);
van.add(document.getElementById('app'),()=>table(
tr(COLS.map(c=>th({onclick:()=>{dir.val=key.val===c?-dir.val:1;key.val=c;}},c))),
sortRows(rows.val,key.val,dir.val).map(r=>tr(COLS.map(c=>td(String(r[c])))))));
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.val=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.val=rows.val.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});`
}, { dependencies: { 'vanjs-core': '^1.5.2' }, devDependencies: { vite: '^6.0.0' } });

// ---------- alpine ----------
proj('alpine', {
  'index.html': `<!doctype html><html><head><meta charset="utf-8"><title>alpine CEO console</title>
<style>body{font-family:system-ui;background:#111;color:#eee;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #333;padding:2px 6px;font-size:12px}th{cursor:pointer}#feed li{font-size:12px}</style>
</head><body>
<h1>alpine console</h1>
<button id="act">Run action</button> <span id="actres"></span>
<ul id="feed"></ul>
<div id="app" x-data="tableData" x-init="init()">
<table><tr><template x-for="c in cols"><th @click="sortBy(c)" x-text="c"></th></template></tr>
<template x-for="r in sorted()" :key="r.id"><tr><template x-for="c in cols"><td x-text="r[c]"></td></template></tr></template></table>
</div>
<script type="module" src="/src/main.js"></script>
</body></html>`,
  'src/main.js': `import Alpine from 'alpinejs';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
Alpine.data('tableData',()=>({cols:COLS,rows:[],key:'id',dir:1,
init(){fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{this.rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{const r=this.rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;}});},
sortBy(c){this.dir=this.key===c?-this.dir:1;this.key=c;},
sorted(){return sortRows(this.rows,this.key,this.dir);}}));
window.Alpine=Alpine;Alpine.start();`
}, { dependencies: { alpinejs: '^3.14.8' }, devDependencies: { vite: '^6.0.0' } });

// ---------- htmx (server-rendered fragments; minimal JS) ----------
proj('htmx', {
  'index.html': `<!doctype html><html><head><meta charset="utf-8"><title>htmx CEO console</title>
<style>body{font-family:system-ui;background:#111;color:#eee;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #333;padding:2px 6px;font-size:12px}th{cursor:pointer}#feed li{font-size:12px}</style>
</head><body>
<h1>htmx console</h1>
<button id="act">Run action</button> <span id="actres"></span>
<ul id="feed"></ul>
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
</body></html>`,
  'src/main.js': `import 'htmx.org';
// htmx has no client templating; JSON->table done with a tiny inline renderer (idiomatic htmx would render HTML server-side).
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;const app=document.getElementById('app');
function render(){let s='<table><tr>'+COLS.map(c=>'<th data-c="'+c+'">'+c+'</th>').join('')+'</tr>';
for(const r of sortRows(rows,key,dir)) s+='<tr>'+COLS.map(c=>'<td>'+r[c]+'</td>').join('')+'</tr>';
app.innerHTML=s+'</table>';
app.querySelectorAll('th').forEach(th=>th.onclick=()=>{const c=th.dataset.c;dir=key===c?-dir:1;key=c;render();});}
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;render();markReady();});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;render();}});`
}, { dependencies: { 'htmx.org': '^1.9.12' }, devDependencies: { vite: '^6.0.0' } });

console.log('generated frontends');
