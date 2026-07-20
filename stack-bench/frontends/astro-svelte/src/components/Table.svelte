<script>
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
let rows=$state([]);let key=$state('id');let dir=$state(1);
$effect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{rows=rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});});
let sorted=$derived(sortRows(rows,key,dir));
</script>
<table><tbody><tr>{#each COLS as c}<th onclick={()=>{dir=key===c?-dir:1;key=c;}}>{c}</th>{/each}</tr>
{#each sorted as r (r.id)}<tr>{#each COLS as c}<td>{r[c]}</td>{/each}</tr>{/each}</tbody></table>