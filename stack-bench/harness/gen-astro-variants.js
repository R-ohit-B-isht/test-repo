// Generates Astro 5 island-variant projects: astro-react, astro-preact, astro-vue, astro-svelte, astro-solid
const fs = require('fs');
const path = require('path');
const FE = path.join(__dirname, '..', 'frontends');
const shared = fs.readFileSync(path.join(FE, 'react', 'src', 'shared.js'), 'utf8');

const page = (island) => `---
${island.import}
---
<html><head><title>astro island console</title></head>
<body style="font-family:system-ui;background:#111;color:#eee">
<h1>astro console</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<div id="app">${island.tag}</div>
</body></html>
`;

const reactTable = `import {useState,useEffect,createElement as h} from '${'react'}';
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
export default function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return h('table',null,[h('tbody',{key:'b'},[h('tr',{key:'h'},COLS.map(c=>h('th',{key:c,onClick:()=>{setDir(key===c?-dir:1);setKey(c);}},c))),
    ...sorted.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))])]);
}
`;

const vueTable = `<script setup>
import {ref,computed,onMounted} from 'vue';
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
const rows=ref([]),key=ref('id'),dir=ref(1);
onMounted(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.value=rows.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
const sorted=computed(()=>sortRows(rows.value,key.value,dir.value));
function clickCol(c){dir.value=key.value===c?-dir.value:1;key.value=c;}
</script>
<template>
<table><tbody><tr><th v-for="c in COLS" :key="c" @click="clickCol(c)">{{c}}</th></tr>
<tr v-for="r in sorted" :key="r.id"><td v-for="c in COLS" :key="c">{{String(r[c])}}</td></tr></tbody></table>
</template>
`;

const svelteTable = fs.readFileSync(path.join(FE, 'svelte', 'src', 'App.svelte'), 'utf8').replace("./shared.js", "../shared.js");

const solidTable = `import {createSignal,createMemo,onMount,For} from 'solid-js';
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
export default function Table(){const [rows,setRows]=createSignal([]);const [key,setKey]=createSignal('id');const [dir,setDir]=createSignal(1);
onMount(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));});
const sorted=createMemo(()=>sortRows(rows(),key(),dir()));
return <table><tbody><tr><For each={COLS}>{c=><th onClick={()=>{setDir(key()===c?-dir():1);setKey(c);}}>{c}</th>}</For></tr>
<For each={sorted()}>{r=><tr><For each={COLS}>{c=><td>{String(r[c])}</td>}</For></tr>}</For></tbody></table>;}
`;

const variants = {
  'astro-react': {
    deps: { astro: '^5.1.1', '@astrojs/react': '^4.1.0', react: '^18.3.1', 'react-dom': '^18.3.1' },
    integration: { name: 'react', pkg: '@astrojs/react' },
    component: { file: 'Table.jsx', src: reactTable },
    import: `import Table from '../components/Table.jsx';`,
    tag: `<Table client:only="react" />`,
  },
  'astro-preact': {
    deps: { astro: '^5.1.1', '@astrojs/preact': '^4.0.0', preact: '^10.25.0' },
    integration: { name: 'preact', pkg: '@astrojs/preact' },
    component: { file: 'Table.jsx', src: reactTable.replace("from 'react'", "from 'preact/hooks'").replace('createElement as h', 'h') },
    import: `import Table from '../components/Table.jsx';`,
    tag: `<Table client:only="preact" />`,
  },
  'astro-vue': {
    deps: { astro: '^5.1.1', '@astrojs/vue': '^5.0.0', vue: '^3.5.13' },
    integration: { name: 'vue', pkg: '@astrojs/vue' },
    component: { file: 'Table.vue', src: vueTable },
    import: `import Table from '../components/Table.vue';`,
    tag: `<Table client:only="vue" />`,
  },
  'astro-svelte': {
    deps: { astro: '^5.1.1', '@astrojs/svelte': '^7.0.0', svelte: '^5.16.0' },
    integration: { name: 'svelte', pkg: '@astrojs/svelte' },
    component: { file: 'Table.svelte', src: svelteTable },
    import: `import Table from '../components/Table.svelte';`,
    tag: `<Table client:only="svelte" />`,
  },
  'astro-solid': {
    deps: { astro: '^5.1.1', '@astrojs/solid-js': '^5.0.0', 'solid-js': '^1.9.3' },
    integration: { name: 'solid', pkg: '@astrojs/solid-js' },
    component: { file: 'Table.jsx', src: solidTable },
    import: `import Table from '../components/Table.jsx';`,
    tag: `<Table client:only="solid-js" />`,
  },
};

// preact fix: h import differs; rewrite for preact to use hooks + h from preact
variants['astro-preact'].component.src = `import {h} from 'preact';import {useState,useEffect} from 'preact/hooks';
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
export default function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return h('table',null,h('tbody',null,[h('tr',{key:'h'},COLS.map(c=>h('th',{key:c,onClick:()=>{setDir(key===c?-dir:1);setKey(c);}},c))),
    ...sorted.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))]));
}
`;

for (const [name, v] of Object.entries(variants)) {
  const dir = path.join(FE, name);
  fs.mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fe-' + name, private: true, type: 'module', scripts: { build: 'astro build' }, dependencies: v.deps }, null, 2));
  fs.writeFileSync(path.join(dir, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import ${v.integration.name} from '${v.integration.pkg}';export default defineConfig({base:'/fe/${name}',outDir:'dist',integrations:[${v.integration.name}()]});`);
  fs.writeFileSync(path.join(dir, 'src', 'shared.js'), shared);
  fs.writeFileSync(path.join(dir, 'src', 'components', v.component.file), v.component.src);
  fs.writeFileSync(path.join(dir, 'src', 'pages', 'index.astro'), page(v));
  console.log('generated', name);
}
