const fastify=require('fastify')();function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));
fastify.get('/api/rows',async()=>ROWS);
fastify.post('/api/action',async()=>({ok:true,ts:Date.now()}));
fastify.get('/api/events',(req,reply)=>{reply.raw.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache'});let i=0;
const t=setInterval(()=>{reply.raw.write('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\n\n');},100);req.raw.on('close',()=>clearInterval(t));});
fastify.listen({port:process.env.PORT||3002,host:'0.0.0.0'}).then(()=>console.log('READY'));