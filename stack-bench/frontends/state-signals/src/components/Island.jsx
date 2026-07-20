import {useEffect} from 'preact/hooks';
import {signal} from '@preact/signals';
const rowsSig=signal([]);
import {h} from 'preact';
import {COLS,getN,wireCommon,markReady} from '../shared.js';

function Rows({rows}){
  return h('table',null,h('tbody',null,rows.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))));
}
function instrument(update){
  return (ev)=>{const t0=performance.now();update(ev);requestAnimationFrame(()=>window.__stateUpdateMs.push(performance.now()-t0));};
}

export default function Island(){
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rowsSig.value=d;requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>{rowsSig.value=rowsSig.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);}));
  },[]);
  return h(Rows,{rows:rowsSig.value});
}
