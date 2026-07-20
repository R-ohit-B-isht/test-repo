const express=require('express');function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));
const app=express();app.use(express.json());
app.get('/api/rows',(req,res)=>res.json(ROWS));
app.post('/api/action',(req,res)=>res.json({ok:true,ts:Date.now()}));
app.get('/api/events',(req,res)=>{res.set({'content-type':'text/event-stream','cache-control':'no-cache'});let i=0;
const t=setInterval(()=>{res.write('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\n\n');},100);req.on('close',()=>clearInterval(t));});
app.listen(process.env.PORT||3001,()=>console.log('READY'));