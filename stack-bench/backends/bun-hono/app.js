import {Hono} from 'hono';import {streamSSE} from 'hono/streaming';
function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));
const app=new Hono();
app.get('/api/rows',(c)=>c.json(ROWS));
app.post('/api/action',(c)=>c.json({ok:true,ts:Date.now()}));
app.get('/api/events',(c)=>streamSSE(c,async(stream)=>{let i=0;while(!stream.aborted){await stream.writeSSE({data:JSON.stringify({seq:i++,ts:Date.now()})});await stream.sleep(100);}}));
export default app;