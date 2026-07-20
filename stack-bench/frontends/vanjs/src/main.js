import van from 'vanjs-core';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
const {table,tr,th,td}=van.tags;
const rows=van.state([]),key=van.state('id'),dir=van.state(1);
van.add(document.getElementById('app'),()=>table(
tr(COLS.map(c=>th({onclick:()=>{dir.val=key.val===c?-dir.val:1;key.val=c;}},c))),
sortRows(rows.val,key.val,dir.val).map(r=>tr(COLS.map(c=>td(String(r[c])))))));
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.val=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows.val=rows.val.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});