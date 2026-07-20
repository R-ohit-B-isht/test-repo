import Alpine from 'alpinejs';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
Alpine.data('tableData',()=>({cols:COLS,rows:[],key:'id',dir:1,
init(){fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{this.rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{const r=this.rows.find(x=>x.id===ev.row_id);if(r){r.latency_ms=ev.latency_ms;r.status=ev.status;}});},
sortBy(c){this.dir=this.key===c?-this.dir:1;this.key=c;},
sorted(){return sortRows(this.rows,this.key,this.dir);}}));
window.Alpine=Alpine;Alpine.start();