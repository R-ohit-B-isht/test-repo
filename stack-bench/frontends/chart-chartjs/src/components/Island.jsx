import {Chart,LineController,LineElement,PointElement,LinearScale,CategoryScale} from 'chart.js';
Chart.register(LineController,LineElement,PointElement,LinearScale,CategoryScale);
if(typeof window!=='undefined')window.__ChartJS=Chart;
import {useEffect,useRef} from 'preact/hooks';
import {h} from 'preact';
import {getN,markReady} from '../shared.js';
export default function ChartIsland(){
  const el=useRef(null);
  useEffect(()=>{
    window.__chartUpdateMs=[];
    const pts={x:[],y:[]};
    let chart=null;
    const Chart=window.__ChartJS; const cv=document.createElement('canvas'); el.current.appendChild(cv);
       chart=new Chart(cv,{type:'line',data:{labels:[],datasets:[{label:'latency',data:[],borderColor:'#58a6ff',pointRadius:0}]},options:{animation:false,responsive:false,scales:{x:{display:true},y:{}}}});
    fetch('/api/rows?n='+getN()).then(r=>r.json()).then(()=>{requestAnimationFrame(()=>markReady());});
    const es=new EventSource('/api/events');
    es.onmessage=(e)=>{
      const ev=JSON.parse(e.data);
      pts.x.push(ev.seq);pts.y.push(ev.latency_ms??(20+ev.seq%400));
      if(pts.x.length>300){pts.x.shift();pts.y.shift();}
      const t0=performance.now();
      chart.data.labels=pts.x.slice();chart.data.datasets[0].data=pts.y.slice();chart.update('none');
      window.__chartUpdateMs.push(performance.now()-t0);
    };
    return ()=>es.close();
  },[]);
  return h('div',{ref:el,style:'width:800px;height:300px'});
}
