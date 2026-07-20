import {h} from 'preact';
import {useState,useEffect,useRef,useMemo} from 'preact/hooks';
import {useReactTable,getCoreRowModel,getSortedRowModel,flexRender,createColumnHelper} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {COLS,getN,wireCommon,markReady} from '../shared.js';
const ch=createColumnHelper();
const columns=COLS.map(c=>ch.accessor(c,{header:c}));
export default function Island(){
  const [rows,setRows]=useState([]);
  const [sorting,setSorting]=useState([]);
  const parentRef=useRef(null);
  useEffect(()=>{
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)));
  },[]);
  const table=useReactTable({data:rows,columns,state:{sorting},onSortingChange:setSorting,getCoreRowModel:getCoreRowModel(),getSortedRowModel:getSortedRowModel()});
  const tableRows=table.getRowModel().rows;
  const virt=useVirtualizer({count:tableRows.length,getScrollElement:()=>parentRef.current,estimateSize:()=>24,overscan:10});
  return h('div',{ref:parentRef,style:'height:600px;overflow:auto'},
    h('table',{style:'width:100%'},
      h('thead',null,table.getHeaderGroups().map(hg=>h('tr',{key:hg.id},hg.headers.map(hd=>
        h('th',{key:hd.id,onClick:hd.column.getToggleSortingHandler()},flexRender(hd.column.columnDef.header,hd.getContext())))))),
      h('tbody',{style:'position:relative;display:block;height:'+virt.getTotalSize()+'px'},
        virt.getVirtualItems().map(vi=>{const r=tableRows[vi.index];
          return h('tr',{key:r.id,style:'position:absolute;top:0;left:0;display:table;table-layout:fixed;width:100%;transform:translateY('+vi.start+'px)'},
            r.getVisibleCells().map(c=>h('td',{key:c.id},String(c.getValue()))));}))));
}
