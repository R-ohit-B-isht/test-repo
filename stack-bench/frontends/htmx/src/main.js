import 'htmx.org';
// htmx has no client templating; JSON->table done with a tiny inline renderer (idiomatic htmx would render HTML server-side).
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;const app=document.getElementById('app');
function render(){let s='<table><tr>'+COLS.map(c=>'<th data-c="'+c+'">'+c+'</th>').join('')+'</tr>';
for(const r of sortRows(rows,key,dir)) s+='<tr>'+COLS.map(c=>'<td>'+r[c]+'</td>').join('')+'</tr>';
app.innerHTML=s+'</table>';
app.querySelectorAll('th').forEach(th=>th.onclick=()=>{const c=th.dataset.c;dir=key===c?-dir:1;key=c;render();});}
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;render();markReady();});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;render();}});