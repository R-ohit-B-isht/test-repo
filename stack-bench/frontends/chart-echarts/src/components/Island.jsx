import * as echarts from 'echarts';
import {useEffect,useRef} from 'preact/hooks';
import {h} from 'preact';
import {getN,markReady} from '../shared.js';
export default function ChartIsland(){
  const el=useRef(null);
  useEffect(()=>{
    window.__chartUpdateMs=[];
    const pts={x:[],y:[]};
    let chart=null;
    chart=echarts.init(el.current,null,{width:800,height:300});
       chart.setOption({animation:false,xAxis:{type:'category',data:[]},yAxis:{type:'value'},series:[{type:'line',data:[],showSymbol:false,lineStyle:{color:'#58a6ff'}}]});
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(()=>{requestAnimationFrame(()=>markReady());});
    const es=new EventSource('/api/events');
    es.onmessage=(e)=>{
      const ev=JSON.parse(e.data);
      pts.x.push(ev.seq);pts.y.push(ev.latency_ms??(20+ev.seq%400));
      if(pts.x.length>300){pts.x.shift();pts.y.shift();}
      const t0=performance.now();
      chart.setOption({xAxis:{data:pts.x.slice()},series:[{data:pts.y.slice()}]});
      window.__chartUpdateMs.push(performance.now()-t0);
    };
    return ()=>es.close();
  },[]);
  return h('div',{ref:el,style:'width:800px;height:300px'});
}
