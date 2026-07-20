import {useState,useEffect,createElement as h} from 'react';
import {COLS,getN,sortRows,wireCommon,markReady} from '../shared.js';
export default function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return h('table',null,[h('tbody',{key:'b'},[h('tr',{key:'h'},COLS.map(c=>h('th',{key:c,onClick:()=>{setDir(key===c?-dir:1);setKey(c);}},c))),
    ...sorted.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))])]);
}
