import {useState,useEffect} from 'react';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
export default function Table(){
  const [rows,setRows]=useState([]);const [key,setKey]=useState('id');const [dir,setDir]=useState(1);
  useEffect(()=>{fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));},[]);
  const sorted=sortRows(rows,key,dir);
  return (<div><button id="act">Run action</button> <span id="actres"></span><ul id="feed"></ul>
  <table><tbody><tr>{COLS.map(c=><th key={c} onClick={()=>{setDir(key===c?-dir:1);setKey(c);}}>{c}</th>)}</tr>
  {sorted.map(r=><tr key={r.id}>{COLS.map(c=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table></div>);
}