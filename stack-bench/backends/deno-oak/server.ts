import {Application,Router} from 'jsr:@oak/oak@17';
function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));
const router=new Router();
router.get('/api/rows',(ctx)=>{ctx.response.type='json';ctx.response.body=ROWS;});
router.post('/api/action',(ctx)=>{ctx.response.type='json';ctx.response.body={ok:true,ts:Date.now()};});
router.get('/api/events',(ctx)=>{ctx.response.headers.set('content-type','text/event-stream');
ctx.response.body=new ReadableStream({start(ctrl){let i=0;const enc=new TextEncoder();const t=setInterval(()=>{try{ctrl.enqueue(enc.encode('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\n\n'));}catch(e){clearInterval(t);}},100);}});});
const app=new Application();app.use(router.routes());
app.addEventListener('listen',()=>console.log('READY'));
await app.listen({port:Number(Deno.env.get('PORT')||3007)});