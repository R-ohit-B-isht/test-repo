import {render} from '@builder.io/qwik';
import {component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
const Table = component$(() => {
  const rows = useSignal<any[]>([]); const key = useSignal('id'); const dir = useSignal(1);
  useVisibleTask$(() => {
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rows.value=d;requestAnimationFrame(()=>markReady());});
    wireCommon((ev:any)=>{rows.value=rows.value.map((r:any)=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});
  });
  const sorted = sortRows(rows.value, key.value, dir.value);
  return <table><tbody><tr>{COLS.map((c:string)=><th key={c} onClick$={()=>{dir.value=key.value===c?-dir.value:1;key.value=c;}}>{c}</th>)}</tr>
  {sorted.map((r:any)=><tr key={r.id}>{COLS.map((c:string)=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table>;
});
render(document.getElementById('app')!, <Table/>);