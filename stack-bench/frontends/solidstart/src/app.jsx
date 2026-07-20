import {createSignal,createMemo,onMount,For} from 'solid-js';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
export default function App(){const [rows,setRows]=createSignal([]);const [key,setKey]=createSignal('id');const [dir,setDir]=createSignal(1);
onMount(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));});
const sorted=createMemo(()=>sortRows(rows(),key(),dir()));
return <div style="font-family:system-ui;background:#111;color:#eee"><h1>solidstart console</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
<table><tbody><tr><For each={COLS}>{c=><th onClick={()=>{setDir(key()===c?-dir():1);setKey(c);}}>{c}</th>}</For></tr>
<For each={sorted()}>{r=><tr><For each={COLS}>{c=><td>{String(r[c])}</td>}</For></tr>}</For></tbody></table></div>;}