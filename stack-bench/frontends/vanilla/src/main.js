import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;const app=document.getElementById('app');
function render(){const t=document.createElement('table');const tr=document.createElement('tr');
COLS.forEach(c=>{const th=document.createElement('th');th.textContent=c;th.onclick=()=>{dir=key===c?-dir:1;key=c;rows=sortRows(rows,key,dir);render();};tr.appendChild(th);});
t.appendChild(tr);for(const r of rows){const tr2=document.createElement('tr');COLS.forEach(c=>{const td=document.createElement('td');td.textContent=r[c];tr2.appendChild(td);});t.appendChild(tr2);}
app.replaceChildren(t);}
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;render();markReady();});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;render();}});