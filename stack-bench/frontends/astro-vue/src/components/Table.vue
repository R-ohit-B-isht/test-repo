<script setup>
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
