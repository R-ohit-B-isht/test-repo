import {Elysia} from 'elysia';function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));
new Elysia()
.get('/api/rows',()=>ROWS)
.post('/api/action',()=>({ok:true,ts:Date.now()}))
.get('/api/events',()=>new Response(new ReadableStream({start(ctrl){let i=0;const t=setInterval(()=>{try{ctrl.enqueue('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\n\n');}catch(e){clearInterval(t);}},100);}}),{headers:{'content-type':'text/event-stream'}}))
.listen(Number(process.env.PORT||3006),()=>console.log('READY'));