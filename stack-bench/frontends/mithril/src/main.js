import m from 'mithril';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
let rows=[],key='id',dir=1;
const Table={view:()=>m('table',[m('tr',COLS.map(c=>m('th',{onclick:()=>{dir=key===c?-dir:1;key=c;}},c))),
sortRows(rows,key,dir).map(r=>m('tr',{key:r.id},COLS.map(c=>m('td',String(r[c])))))])};
m.mount(document.getElementById('app'),Table);
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;m.redraw();requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{const r=rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;m.redraw();}});