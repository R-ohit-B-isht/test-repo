<template><div style="font-family:system-ui;background:#111;color:#eee">
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
</script>