import {createApp,ref,computed,onMounted,h} from 'vue';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
createApp({setup(){const rows=ref([]),key=ref('id'),dir=ref(1);
onMounted(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.value=rows.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
const sorted=computed(()=>sortRows(rows.value,key.value,dir.value));
return ()=>h('table',[h('tr',COLS.map(c=>h('th',{onClick:()=>{dir.value=key.value===c?-dir.value:1;key.value=c;}},c))),
sorted.value.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',String(r[c])))))]);}}).mount('#app');