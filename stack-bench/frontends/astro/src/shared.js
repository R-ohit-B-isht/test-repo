
export const COLS = ['id','service','region','status','latency_ms','rps','updated_at'];
export function getN(){ return parseInt(new URLSearchParams(location.search).get('n')||'200',10); }
export function sortRows(rows, key, dir){ return [...rows].sort((a,b)=> (a[key]>b[key]?1:a[key]<b[key]?-1:0)*dir); }
export function wireCommon(onEvent){
  const feed=document.getElementById('feed');
  const es=new EventSource('/api/events');
  es.onmessage=(e)=>{ const ev=JSON.parse(e.data);
    const li=document.createElement('li'); li.textContent=ev.seq+' '+ev.status+' '+ev.msg;
    feed.prepend(li); while(feed.children.length>20) feed.lastChild.remove();
    onEvent&&onEvent(ev); };
  document.getElementById('act').onclick=async()=>{
    const r=await fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cmd:'restart'})});
    document.getElementById('actres').textContent=JSON.stringify(await r.json()); };
}
export function markReady(){ window.__benchReady=true; window.__tableRenderedAt=performance.now(); }
