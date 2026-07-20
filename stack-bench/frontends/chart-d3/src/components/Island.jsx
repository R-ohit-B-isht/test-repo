import * as d3 from 'd3';
import {useEffect,useRef} from 'preact/hooks';
import {h} from 'preact';
import {getN,markReady} from '../shared.js';
export default function ChartIsland(){
  const el=useRef(null);
  useEffect(()=>{
    window.__chartUpdateMs=[];
    const pts={x:[],y:[]};
    let chart=null;
    const svg=d3.select(el.current).append('svg').attr('width',800).attr('height',300);
       const pathEl=svg.append('path').attr('fill','none').attr('stroke','#58a6ff').attr('stroke-width',2);
       chart={svg,pathEl};
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(()=>{requestAnimationFrame(()=>markReady());});
    const es=new EventSource('/api/events');
    es.onmessage=(e)=>{
      const ev=JSON.parse(e.data);
      pts.x.push(ev.seq);pts.y.push(ev.latency_ms??(20+ev.seq%400));
      if(pts.x.length>300){pts.x.shift();pts.y.shift();}
      const t0=performance.now();
      const xs=d3.scaleLinear().domain(d3.extent(pts.x)).range([0,800]);
       const ys=d3.scaleLinear().domain([0,d3.max(pts.y)||1]).range([300,0]);
       chart.pathEl.attr('d',d3.line().x((d,i)=>xs(pts.x[i])).y((d,i)=>ys(pts.y[i]))(pts.y));
      window.__chartUpdateMs.push(performance.now()-t0);
    };
    return ()=>es.close();
  },[]);
  return h('div',{ref:el,style:'width:800px;height:300px'});
}
