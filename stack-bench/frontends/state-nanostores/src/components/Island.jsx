import {useEffect} from 'preact/hooks';
import {atom} from 'nanostores';
import {useStore} from '@nanostores/preact';
const rowsStore=atom([]);
import {h} from 'preact';
import {COLS,getN,wireCommon,markReady} from '../shared.js';

function Rows({rows}){
  return h('table',null,h('tbody',null,rows.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))));
}
function instrument(update){
  return (ev)=>{const t0=performance.now();update(ev);requestAnimationFrame(()=>window.__stateUpdateMs.push(performance.now()-t0));};
}

export default function Island(){
  const rows=useStore(rowsStore);
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rowsStore.set(d);requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>rowsStore.set(rowsStore.get().map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r))));
  },[]);
  return h(Rows,{rows});
}
