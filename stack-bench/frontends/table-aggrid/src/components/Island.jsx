import {h} from 'preact';
import {useEffect,useRef} from 'preact/hooks';
import {createGrid,ModuleRegistry,AllCommunityModule,themeQuartz} from 'ag-grid-community';
import {COLS,getN,wireCommon,markReady} from '../shared.js';
ModuleRegistry.registerModules([AllCommunityModule]);
export default function Island(){
  const el=useRef(null);
  useEffect(()=>{
    const api=createGrid(el.current,{theme:themeQuartz,columnDefs:COLS.map(c=>({field:c,sortable:true})),rowData:[],getRowId:p=>String(p.data.id)});
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{api.setGridOption('rowData',d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>{const node=api.getRowNode(String(ev.row_id));if(node)node.setData({...node.data,latency_ms:ev.latency_ms,status:ev.status});});
  },[]);
  return h('div',{ref:el,style:'height:600px;width:100%'});
}
