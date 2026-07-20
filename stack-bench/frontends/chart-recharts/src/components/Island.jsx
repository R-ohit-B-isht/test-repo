import {h} from 'preact';
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
