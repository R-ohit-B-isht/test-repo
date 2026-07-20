// Round 2 library benchmarks on Astro 5 + Preact island.
// Charts: recharts (compat), apexcharts, lightweight-charts, d3, plotly.js
// Tables: ag-grid community
// State: signals, hooks (baseline exists), zustand (compat), jotai (compat), nanostores
const fs = require('fs');
const path = require('path');
const FE = path.join(__dirname, '..', 'frontends');
const shared = fs.readFileSync(path.join(FE, 'react', 'src', 'shared.js'), 'utf8');

const page = (name, comp, compat) => `---
import Island from '../components/${comp}';
---
<html><head><title>${name}</title></head>
<body style="font-family:system-ui;background:#111;color:#eee">
<h1>${name}</h1>
<button id="act">Run action</button> <span id="actres"></span><ul id="feed" style="display:none"></ul>
<div id="app"><Island client:only="preact" /></div>
</body></html>
`;

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
  'chart-apex': {
    deps: { apexcharts: '^4.3.0' },
    compat: false,
    component: chartWrap(
      `chart=new ApexCharts(el.current,{chart:{type:'line',width:800,height:300,animations:{enabled:false}},series:[{name:'latency',data:[]}],xaxis:{type:'numeric'},stroke:{width:2}});
       chart.render();`,
      `chart.updateSeries([{data:pts.x.map((x,i)=>[x,pts.y[i]])}],false);`,
      `import ApexCharts from 'apexcharts';`
    ),
  },
  'chart-lwc': {
    deps: { 'lightweight-charts': '^4.2.2' },
    compat: false,
    component: chartWrap(
      `const lwc=createChart(el.current,{width:800,height:300});
       const series=lwc.addLineSeries({color:'#58a6ff'});
       chart={lwc,series};`,
      `chart.series.setData(pts.x.map((x,i)=>({time:x,value:pts.y[i]})));`,
      `import {createChart} from 'lightweight-charts';`
    ),
  },
  'chart-d3': {
    deps: { d3: '^7.9.0' },
    compat: false,
    component: chartWrap(
      `const svg=d3.select(el.current).append('svg').attr('width',800).attr('height',300);
       const pathEl=svg.append('path').attr('fill','none').attr('stroke','#58a6ff').attr('stroke-width',2);
       chart={svg,pathEl};`,
      `const xs=d3.scaleLinear().domain(d3.extent(pts.x)).range([0,800]);
       const ys=d3.scaleLinear().domain([0,d3.max(pts.y)||1]).range([300,0]);
       chart.pathEl.attr('d',d3.line().x((d,i)=>xs(pts.x[i])).y((d,i)=>ys(pts.y[i]))(pts.y));`,
      `import * as d3 from 'd3';`
    ),
  },
  'chart-plotly': {
    deps: { 'plotly.js-dist-min': '^2.35.3' },
    compat: false,
    component: chartWrap(
      `Plotly.newPlot(el.current,[{x:[],y:[],mode:'lines',line:{color:'#58a6ff'}}],{width:800,height:300},{staticPlot:true});chart=true;`,
      `Plotly.react(el.current,[{x:pts.x.slice(),y:pts.y.slice(),mode:'lines',line:{color:'#58a6ff'}}],{width:800,height:300},{staticPlot:true});`,
      `import Plotly from 'plotly.js-dist-min';`
    ),
  },
  'chart-recharts': {
    deps: { recharts: '^2.15.0' },
    compat: true,
    componentSrc: `import {h} from 'preact';
import {useState,useEffect} from 'preact/hooks';
import {LineChart,Line,XAxis,YAxis} from 'recharts';
import {getN,markReady} from '../shared.js';
export default function ChartIsland(){
  const [data,setData]=useState([]);
  useEffect(()=>{
    window.__chartUpdateMs=[];
    let pts=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(()=>{requestAnimationFrame(()=>markReady());});
    const es=new EventSource('/api/events');
    es.onmessage=(e)=>{
      const ev=JSON.parse(e.data);
      pts=[...pts,{x:ev.seq,y:ev.latency_ms??(20+ev.seq%400)}].slice(-300);
      const t0=performance.now();
      setData(pts);
      requestAnimationFrame(()=>window.__chartUpdateMs.push(performance.now()-t0));
    };
    return ()=>es.close();
  },[]);
  return h(LineChart,{width:800,height:300,data},
    h(XAxis,{dataKey:'x'}),h(YAxis,null),
    h(Line,{type:'linear',dataKey:'y',stroke:'#58a6ff',dot:false,isAnimationActive:false}));
}
`,
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
  fs.writeFileSync(path.join(dir, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import preact from '@astrojs/preact';export default defineConfig({base:'/fe/${name}',outDir:'dist',integrations:[preact(${v.compat ? '{compat:true}' : ''})]});`);
  fs.writeFileSync(path.join(dir, 'src', 'shared.js'), shared);
  fs.writeFileSync(path.join(dir, 'src', 'components', 'Island.jsx'), v.componentSrc || v.component);
  fs.writeFileSync(path.join(dir, 'src', 'pages', 'index.astro'), page(name, 'Island.jsx'));
  console.log('generated', name);
}

// ---- table: AG Grid Community ----
const ag = path.join(FE, 'table-aggrid');
fs.mkdirSync(path.join(ag, 'src', 'pages'), { recursive: true });
fs.mkdirSync(path.join(ag, 'src', 'components'), { recursive: true });
fs.writeFileSync(path.join(ag, 'package.json'), JSON.stringify({
  name: 'fe-table-aggrid', private: true, type: 'module', scripts: { build: 'astro build' },
  dependencies: { astro: '^5.1.1', '@astrojs/preact': '^4.0.0', preact: '^10.25.0', 'ag-grid-community': '^33.0.3' },
}, null, 2));
fs.writeFileSync(path.join(ag, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import preact from '@astrojs/preact';export default defineConfig({base:'/fe/table-aggrid',outDir:'dist',integrations:[preact()]});`);
fs.writeFileSync(path.join(ag, 'src', 'shared.js'), shared);
fs.writeFileSync(path.join(ag, 'src', 'components', 'Island.jsx'), `import {h} from 'preact';
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
`);
fs.writeFileSync(path.join(ag, 'src', 'pages', 'index.astro'), page('table-aggrid', 'Island.jsx'));
console.log('generated table-aggrid');

// ---- state management variants: table updated from SSE at 10Hz, measure update commit cost ----
const stateWrap = (imports, body) => `${imports}
import {h} from 'preact';
import {COLS,getN,wireCommon,markReady} from '../shared.js';
${body}
`;
const stateTable = `
function Rows({rows}){
  return h('table',null,h('tbody',null,rows.map(r=>h('tr',{key:r.id},COLS.map(c=>h('td',{key:c},String(r[c])))))));
}
function instrument(update){
  return (ev)=>{const t0=performance.now();update(ev);requestAnimationFrame(()=>window.__stateUpdateMs.push(performance.now()-t0));};
}
`;
const stateVariants = {
  'state-hooks': {
    deps: {}, compat: false,
    src: stateWrap(`import {useState,useEffect} from 'preact/hooks';`, stateTable + `
export default function Island(){
  const [rows,setRows]=useState([]);
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>setRows(rs=>rs.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r))));
  },[]);
  return h(Rows,{rows});
}`),
  },
  'state-signals': {
    deps: { '@preact/signals': '^2.0.0' }, compat: false,
    src: stateWrap(`import {useEffect} from 'preact/hooks';
import {signal} from '@preact/signals';
const rowsSig=signal([]);`, stateTable + `
export default function Island(){
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rowsSig.value=d;requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>{rowsSig.value=rowsSig.value.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);}));
  },[]);
  return h(Rows,{rows:rowsSig.value});
}`),
  },
  'state-zustand': {
    deps: { zustand: '^5.0.2' }, compat: true,
    src: stateWrap(`import {useEffect} from 'preact/hooks';
import {create} from 'zustand';
const useStore=create((set)=>({rows:[],setRows:(rows)=>set({rows}),applyEv:(ev)=>set((s)=>({rows:s.rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r)}))}));`, stateTable + `
export default function Island(){
  const rows=useStore(s=>s.rows);
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{useStore.getState().setRows(d);requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>useStore.getState().applyEv(ev)));
  },[]);
  return h(Rows,{rows});
}`),
  },
  'state-jotai': {
    deps: { jotai: '^2.11.0' }, compat: true,
    src: stateWrap(`import {useEffect} from 'preact/hooks';
import {atom,useAtom,getDefaultStore} from 'jotai';
const rowsAtom=atom([]);
const store=getDefaultStore();`, stateTable + `
export default function Island(){
  const [rows]=useAtom(rowsAtom);
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{store.set(rowsAtom,d);requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>store.set(rowsAtom,store.get(rowsAtom).map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r))));
  },[]);
  return h(Rows,{rows});
}`),
  },
  'state-nanostores': {
    deps: { nanostores: '^0.11.3', '@nanostores/preact': '^0.5.2' }, compat: false,
    src: stateWrap(`import {useEffect} from 'preact/hooks';
import {atom} from 'nanostores';
import {useStore} from '@nanostores/preact';
const rowsStore=atom([]);`, stateTable + `
export default function Island(){
  const rows=useStore(rowsStore);
  useEffect(()=>{
    window.__stateUpdateMs=[];
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{rowsStore.set(d);requestAnimationFrame(()=>markReady());});
    wireCommon(instrument(ev=>rowsStore.set(rowsStore.get().map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r))));
  },[]);
  return h(Rows,{rows});
}`),
  },
};
for (const [name, v] of Object.entries(stateVariants)) {
  const dir = path.join(FE, name);
  fs.mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'fe-' + name, private: true, type: 'module', scripts: { build: 'astro build' },
    dependencies: { astro: '^5.1.1', '@astrojs/preact': '^4.0.0', preact: '^10.25.0', ...v.deps },
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import preact from '@astrojs/preact';export default defineConfig({base:'/fe/${name}',outDir:'dist',integrations:[preact(${v.compat ? '{compat:true}' : ''})]});`);
  fs.writeFileSync(path.join(dir, 'src', 'shared.js'), shared);
  fs.writeFileSync(path.join(dir, 'src', 'components', 'Island.jsx'), v.src);
  fs.writeFileSync(path.join(dir, 'src', 'pages', 'index.astro'), page(name, 'Island.jsx'));
  console.log('generated', name);
}
