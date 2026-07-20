// Library-level benchmarks on Astro 5 + Preact island:
//  chart-chartjs / chart-uplot / chart-echarts / chart-plot  -> live line chart fed by SSE (10Hz), last 300 pts
//  table-tanstack -> TanStack Table + Virtual (via preact/compat) with 10k rows
const fs = require('fs');
const path = require('path');
const FE = path.join(__dirname, '..', 'frontends');
const shared = fs.readFileSync(path.join(FE, 'react', 'src', 'shared.js'), 'utf8');

const page = (name, comp) => `---
import Island from '../components/${comp}';
---
<html><head><title>${name}</title></head>
<body style="font-family:system-ui;background:#111;color:#eee">
<h1>${name}</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed" style="display:none"></ul>
<div id="app"><Island client:only="preact" /></div>
</body></html>
`;

// Every chart island: fetch rows (markReady), open SSE, push latency point, timed update.
const chartWrap = (setupCode, updateCode, imports) => `${imports}
import {useEffect,useRef} from 'preact/hooks';
import {h} from 'preact';
import {getN,markReady} from '../shared.js';
export default function ChartIsland(){
  const el=useRef(null);
  useEffect(()=>{
    window.__chartUpdateMs=[];
    const pts={x:[],y:[]};
    let chart=null;
    ${setupCode}
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(()=>{requestAnimationFrame(()=>markReady());});
    const es=new EventSource('/api/events');
    es.onmessage=(e)=>{
      const ev=JSON.parse(e.data);
      pts.x.push(ev.seq);pts.y.push(ev.latency_ms??(20+ev.seq%400));
      if(pts.x.length>300){pts.x.shift();pts.y.shift();}
      const t0=performance.now();
      ${updateCode}
      window.__chartUpdateMs.push(performance.now()-t0);
    };
    return ()=>es.close();
  },[]);
  return h('div',{ref:el,style:'width:800px;height:300px'});
}
`;

const variants = {
  'chart-chartjs': {
    deps: { 'chart.js': '^4.4.7' },
    component: chartWrap(
      `const Chart=window.__ChartJS; const cv=document.createElement('canvas'); el.current.appendChild(cv);
       chart=new Chart(cv,{type:'line',data:{labels:[],datasets:[{label:'latency',data:[],borderColor:'#58a6ff',pointRadius:0}]},options:{animation:false,responsive:false,scales:{x:{display:true},y:{}}}});`,
      `chart.data.labels=pts.x.slice();chart.data.datasets[0].data=pts.y.slice();chart.update('none');`,
      `import {Chart,LineController,LineElement,PointElement,LinearScale,CategoryScale} from 'chart.js';
Chart.register(LineController,LineElement,PointElement,LinearScale,CategoryScale);
if(typeof window!=='undefined')window.__ChartJS=Chart;`
    ),
  },
  'chart-uplot': {
    deps: { uplot: '^1.6.31' },
    component: chartWrap(
      `chart=new uPlot({width:800,height:300,series:[{},{label:'latency',stroke:'#58a6ff'}],scales:{x:{time:false}}},[pts.x,pts.y],el.current);`,
      `chart.setData([pts.x,pts.y]);`,
      `import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';`
    ),
  },
  'chart-echarts': {
    deps: { echarts: '^5.5.1' },
    component: chartWrap(
      `chart=echarts.init(el.current,null,{width:800,height:300});
       chart.setOption({animation:false,xAxis:{type:'category',data:[]},yAxis:{type:'value'},series:[{type:'line',data:[],showSymbol:false,lineStyle:{color:'#58a6ff'}}]});`,
      `chart.setOption({xAxis:{data:pts.x.slice()},series:[{data:pts.y.slice()}]});`,
      `import * as echarts from 'echarts';`
    ),
  },
  'chart-plot': {
    deps: { '@observablehq/plot': '^0.6.16' },
    component: chartWrap(
      ``,
      `const fig=Plot.plot({width:800,height:300,marks:[Plot.lineY(pts.y.map((y,i)=>({x:pts.x[i],y})),{x:'x',y:'y',stroke:'#58a6ff'})]});
       el.current.replaceChildren(fig);`,
      `import * as Plot from '@observablehq/plot';`
    ),
  },
};

for (const [name, v] of Object.entries(variants)) {
  const dir = path.join(FE, name);
  fs.mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'fe-' + name, private: true, type: 'module', scripts: { build: 'astro build' },
    dependencies: { astro: '^5.1.1', '@astrojs/preact': '^4.0.0', preact: '^10.25.0', ...v.deps },
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import preact from '@astrojs/preact';export default defineConfig({base:'/fe/${name}',outDir:'dist',integrations:[preact()]});`);
  fs.writeFileSync(path.join(dir, 'src', 'shared.js'), shared);
  fs.writeFileSync(path.join(dir, 'src', 'components', 'Island.jsx'), v.component);
  fs.writeFileSync(path.join(dir, 'src', 'pages', 'index.astro'), page(name, 'Island.jsx'));
  console.log('generated', name);
}

// table-tanstack: TanStack Table + Virtual on preact/compat
const tt = path.join(FE, 'table-tanstack');
fs.mkdirSync(path.join(tt, 'src', 'pages'), { recursive: true });
fs.mkdirSync(path.join(tt, 'src', 'components'), { recursive: true });
fs.writeFileSync(path.join(tt, 'package.json'), JSON.stringify({
  name: 'fe-table-tanstack', private: true, type: 'module', scripts: { build: 'astro build' },
  dependencies: { astro: '^5.1.1', '@astrojs/preact': '^4.0.0', preact: '^10.25.0', '@tanstack/react-table': '^8.20.6', '@tanstack/react-virtual': '^3.11.2' },
}, null, 2));
fs.writeFileSync(path.join(tt, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import preact from '@astrojs/preact';export default defineConfig({base:'/fe/table-tanstack',outDir:'dist',integrations:[preact({compat:true})]});`);
fs.writeFileSync(path.join(tt, 'src', 'shared.js'), shared);
fs.writeFileSync(path.join(tt, 'src', 'components', 'Island.jsx'), `import {h} from 'preact';
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
`);
fs.writeFileSync(path.join(tt, 'src', 'pages', 'index.astro'), page('table-tanstack', 'Island.jsx'));
console.log('generated table-tanstack');
