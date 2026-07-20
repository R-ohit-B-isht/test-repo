// Minimal equivalent backend implementations of the reference workload.
// Endpoints: GET /api/rows (200 rows JSON), POST /api/action, GET /api/events (SSE 10/s)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'backends');
function w(rel, c) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); }

const JS_ROWS = `function makeRow(i){return {id:i,service:'svc-'+(i%12),region:['us-east','us-west','eu-central'][i%3],status:['ok','warn','err'][i%3],latency_ms:20+((i*37)%400),rps:100+((i*91)%5000),updated_at:new Date(1752900000000+i*1000).toISOString()};}
const ROWS = Array.from({length:200},(_,i)=>makeRow(i));`;

// ---- node-express ----
w('node-express/package.json', JSON.stringify({ name: 'be-express', private: true, dependencies: { express: '^4.21.2' }, scripts: { start: 'node server.js' } }, null, 2));
w('node-express/server.js', `const express=require('express');${JS_ROWS}
const app=express();app.use(express.json());
app.get('/api/rows',(req,res)=>res.json(ROWS));
app.post('/api/action',(req,res)=>res.json({ok:true,ts:Date.now()}));
app.get('/api/events',(req,res)=>{res.set({'content-type':'text/event-stream','cache-control':'no-cache'});let i=0;
const t=setInterval(()=>{res.write('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\\n\\n');},100);req.on('close',()=>clearInterval(t));});
app.listen(process.env.PORT||3001,()=>console.log('READY'));`);

// ---- node-fastify ----
w('node-fastify/package.json', JSON.stringify({ name: 'be-fastify', private: true, dependencies: { fastify: '^5.2.0' }, scripts: { start: 'node server.js' } }, null, 2));
w('node-fastify/server.js', `const fastify=require('fastify')();${JS_ROWS}
fastify.get('/api/rows',async()=>ROWS);
fastify.post('/api/action',async()=>({ok:true,ts:Date.now()}));
fastify.get('/api/events',(req,reply)=>{reply.raw.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache'});let i=0;
const t=setInterval(()=>{reply.raw.write('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\\n\\n');},100);req.raw.on('close',()=>clearInterval(t));});
fastify.listen({port:process.env.PORT||3002,host:'0.0.0.0'}).then(()=>console.log('READY'));`);

// ---- node-hono ----
w('node-hono/package.json', JSON.stringify({ name: 'be-node-hono', private: true, type: 'module', dependencies: { hono: '^4.6.15', '@hono/node-server': '^1.13.7' }, scripts: { start: 'node server.js' } }, null, 2));
const HONO_APP = `import {Hono} from 'hono';import {streamSSE} from 'hono/streaming';
${JS_ROWS}
const app=new Hono();
app.get('/api/rows',(c)=>c.json(ROWS));
app.post('/api/action',(c)=>c.json({ok:true,ts:Date.now()}));
app.get('/api/events',(c)=>streamSSE(c,async(stream)=>{let i=0;while(!stream.aborted){await stream.writeSSE({data:JSON.stringify({seq:i++,ts:Date.now()})});await stream.sleep(100);}}));
export default app;`;
w('node-hono/app.js', HONO_APP);
w('node-hono/server.js', `import {serve} from '@hono/node-server';import app from './app.js';
serve({fetch:app.fetch,port:Number(process.env.PORT||3003)},()=>console.log('READY'));`);

// ---- bun-hono ----
w('bun-hono/package.json', JSON.stringify({ name: 'be-bun-hono', private: true, type: 'module', dependencies: { hono: '^4.6.15' } }, null, 2));
w('bun-hono/app.js', HONO_APP);
w('bun-hono/server.js', `import app from './app.js';
const port=Number(process.env.PORT||3005);
console.log('READY');
export default {port,fetch:app.fetch};`);

// ---- bun-elysia ----
w('bun-elysia/package.json', JSON.stringify({ name: 'be-bun-elysia', private: true, type: 'module', dependencies: { elysia: '^1.2.9' } }, null, 2));
w('bun-elysia/server.js', `import {Elysia} from 'elysia';${JS_ROWS}
new Elysia()
.get('/api/rows',()=>ROWS)
.post('/api/action',()=>({ok:true,ts:Date.now()}))
.get('/api/events',function*(){})
.get('/api/events2',()=>new Response(new ReadableStream({start(ctrl){let i=0;const t=setInterval(()=>{try{ctrl.enqueue('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\\n\\n');}catch(e){clearInterval(t);}},100);}}),{headers:{'content-type':'text/event-stream'}}))
.listen(Number(process.env.PORT||3006),()=>console.log('READY'));`);

// ---- deno-oak ----
w('deno-oak/server.ts', `import {Application,Router} from 'jsr:@oak/oak@17';
${JS_ROWS}
const router=new Router();
router.get('/api/rows',(ctx)=>{ctx.response.type='json';ctx.response.body=ROWS;});
router.post('/api/action',(ctx)=>{ctx.response.type='json';ctx.response.body={ok:true,ts:Date.now()};});
router.get('/api/events',(ctx)=>{ctx.response.headers.set('content-type','text/event-stream');
ctx.response.body=new ReadableStream({start(ctrl){let i=0;const enc=new TextEncoder();const t=setInterval(()=>{try{ctrl.enqueue(enc.encode('data: '+JSON.stringify({seq:i++,ts:Date.now()})+'\\n\\n'));}catch(e){clearInterval(t);}},100);}});});
const app=new Application();app.use(router.routes());
app.addEventListener('listen',()=>console.log('READY'));
await app.listen({port:Number(Deno.env.get('PORT')||3007)});`);

// ---- go shared ----
const GO_ROWS = `type Row struct {
	ID int \`json:"id"\`
	Service string \`json:"service"\`
	Region string \`json:"region"\`
	Status string \`json:"status"\`
	LatencyMs int \`json:"latency_ms"\`
	RPS int \`json:"rps"\`
	UpdatedAt string \`json:"updated_at"\`
}
var regions = []string{"us-east", "us-west", "eu-central"}
var statuses = []string{"ok", "warn", "err"}
func makeRows() []Row {
	rows := make([]Row, 200)
	for i := 0; i < 200; i++ {
		rows[i] = Row{i, fmt.Sprintf("svc-%d", i%12), regions[i%3], statuses[i%3], 20 + ((i * 37) % 400), 100 + ((i * 91) % 5000), time.UnixMilli(1752900000000 + int64(i)*1000).UTC().Format(time.RFC3339)}
	}
	return rows
}
var rows = makeRows()`;

// go-nethttp
w('go-nethttp/main.go', `package main
import ("encoding/json";"fmt";"net/http";"os";"time")
${GO_ROWS}
func main() {
	http.HandleFunc("/api/rows", func(w http.ResponseWriter, r *http.Request) { w.Header().Set("Content-Type", "application/json"); json.NewEncoder(w).Encode(rows) })
	http.HandleFunc("/api/action", func(w http.ResponseWriter, r *http.Request) { w.Header().Set("Content-Type", "application/json"); json.NewEncoder(w).Encode(map[string]any{"ok": true, "ts": time.Now().UnixMilli()}) })
	http.HandleFunc("/api/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		f := w.(http.Flusher)
		i := 0
		t := time.NewTicker(100 * time.Millisecond)
		defer t.Stop()
		for {
			select {
			case <-r.Context().Done():
				return
			case <-t.C:
				fmt.Fprintf(w, "data: {\\"seq\\":%d,\\"ts\\":%d}\\n\\n", i, time.Now().UnixMilli())
				i++
				f.Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3010" }
	fmt.Println("READY")
	http.ListenAndServe(":"+port, nil)
}`);
w('go-nethttp/go.mod', `module benchns\n\ngo 1.23\n`);

// go-fiber
w('go-fiber/main.go', `package main
import ("bufio";"fmt";"os";"time"
	"github.com/gofiber/fiber/v2")
${GO_ROWS}
func main() {
	app := fiber.New()
	app.Get("/api/rows", func(c *fiber.Ctx) error { return c.JSON(rows) })
	app.Post("/api/action", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true, "ts": time.Now().UnixMilli()}) })
	app.Get("/api/events", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/event-stream")
		c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
			i := 0
			for {
				fmt.Fprintf(w, "data: {\\"seq\\":%d,\\"ts\\":%d}\\n\\n", i, time.Now().UnixMilli())
				i++
				if err := w.Flush(); err != nil { return }
				time.Sleep(100 * time.Millisecond)
			}
		})
		return nil
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3011" }
	fmt.Println("READY")
	app.Listen(":" + port)
}`);
w('go-fiber/go.mod', `module benchfiber\n\ngo 1.23\n`);

// go-echo
w('go-echo/main.go', `package main
import ("fmt";"net/http";"os";"time"
	"github.com/labstack/echo/v4")
${GO_ROWS}
func main() {
	e := echo.New()
	e.HideBanner = true
	e.GET("/api/rows", func(c echo.Context) error { return c.JSON(http.StatusOK, rows) })
	e.POST("/api/action", func(c echo.Context) error { return c.JSON(http.StatusOK, map[string]any{"ok": true, "ts": time.Now().UnixMilli()}) })
	e.GET("/api/events", func(c echo.Context) error {
		c.Response().Header().Set("Content-Type", "text/event-stream")
		c.Response().WriteHeader(http.StatusOK)
		i := 0
		t := time.NewTicker(100 * time.Millisecond)
		defer t.Stop()
		for {
			select {
			case <-c.Request().Context().Done():
				return nil
			case <-t.C:
				fmt.Fprintf(c.Response(), "data: {\\"seq\\":%d,\\"ts\\":%d}\\n\\n", i, time.Now().UnixMilli())
				i++
				c.Response().Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3012" }
	fmt.Println("READY")
	e.Start(":" + port)
}`);
w('go-echo/go.mod', `module benchecho\n\ngo 1.23\n`);

// go-gin
w('go-gin/main.go', `package main
import ("fmt";"os";"time"
	"github.com/gin-gonic/gin")
${GO_ROWS}
func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.GET("/api/rows", func(c *gin.Context) { c.JSON(200, rows) })
	r.POST("/api/action", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true, "ts": time.Now().UnixMilli()}) })
	r.GET("/api/events", func(c *gin.Context) {
		c.Header("Content-Type", "text/event-stream")
		i := 0
		t := time.NewTicker(100 * time.Millisecond)
		defer t.Stop()
		for {
			select {
			case <-c.Request.Context().Done():
				return
			case <-t.C:
				fmt.Fprintf(c.Writer, "data: {\\"seq\\":%d,\\"ts\\":%d}\\n\\n", i, time.Now().UnixMilli())
				i++
				c.Writer.Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3013" }
	fmt.Println("READY")
	r.Run(":" + port)
}`);
w('go-gin/go.mod', `module benchgin\n\ngo 1.23\n`);

// ---- rust-axum ----
w('rust-axum/Cargo.toml', `[package]
name = "bench-axum"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
futures = "0.3"
tokio-stream = "0.1"

[profile.release]
opt-level = 3
`);
w('rust-axum/src/main.rs', `use axum::{routing::{get, post}, Json, Router, response::sse::{Event, Sse}};
use serde::Serialize;
use std::{convert::Infallible, time::Duration};
use tokio_stream::StreamExt;

#[derive(Serialize, Clone)]
struct Row { id: usize, service: String, region: String, status: String, latency_ms: usize, rps: usize, updated_at: String }

fn make_rows() -> Vec<Row> {
    let regions = ["us-east", "us-west", "eu-central"];
    let statuses = ["ok", "warn", "err"];
    (0..200).map(|i| Row { id: i, service: format!("svc-{}", i % 12), region: regions[i % 3].into(), status: statuses[i % 3].into(), latency_ms: 20 + ((i * 37) % 400), rps: 100 + ((i * 91) % 5000), updated_at: format!("2025-07-19T04:{:02}:{:02}Z", (i / 60) % 60, i % 60) }).collect()
}

async fn rows() -> Json<Vec<Row>> { Json(make_rows()) }
async fn action() -> Json<serde_json::Value> { Json(serde_json::json!({"ok": true})) }
async fn events() -> Sse<impl futures::Stream<Item = Result<Event, Infallible>>> {
    let stream = tokio_stream::wrappers::IntervalStream::new(tokio::time::interval(Duration::from_millis(100)))
        .enumerate()
        .map(|(i, _)| Ok(Event::default().data(format!("{{\\"seq\\":{}}}", i))));
    Sse::new(stream)
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/api/rows", get(rows)).route("/api/action", post(action)).route("/api/events", get(events));
    let port = std::env::var("PORT").unwrap_or("3020".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
    println!("READY");
    axum::serve(listener, app).await.unwrap();
}`);

// ---- rust-actix ----
w('rust-actix/Cargo.toml', `[package]
name = "bench-actix"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
futures = "0.3"
tokio = { version = "1", features = ["full"] }
tokio-stream = "0.1"
actix-web-lab = "0.23"

[profile.release]
opt-level = 3
`);
w('rust-actix/src/main.rs', `use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::Serialize;
use std::time::Duration;
use tokio_stream::StreamExt;

#[derive(Serialize, Clone)]
struct Row { id: usize, service: String, region: String, status: String, latency_ms: usize, rps: usize, updated_at: String }

fn make_rows() -> Vec<Row> {
    let regions = ["us-east", "us-west", "eu-central"];
    let statuses = ["ok", "warn", "err"];
    (0..200).map(|i| Row { id: i, service: format!("svc-{}", i % 12), region: regions[i % 3].into(), status: statuses[i % 3].into(), latency_ms: 20 + ((i * 37) % 400), rps: 100 + ((i * 91) % 5000), updated_at: format!("2025-07-19T04:{:02}:{:02}Z", (i / 60) % 60, i % 60) }).collect()
}

#[get("/api/rows")]
async fn rows() -> impl Responder { web::Json(make_rows()) }

#[post("/api/action")]
async fn action() -> impl Responder { web::Json(serde_json::json!({"ok": true})) }

#[get("/api/events")]
async fn events() -> impl Responder {
    let stream = tokio_stream::wrappers::IntervalStream::new(tokio::time::interval(Duration::from_millis(100)))
        .enumerate()
        .map(|(i, _)| Ok::<_, std::convert::Infallible>(web::Bytes::from(format!("data: {{\\"seq\\":{}}}\\n\\n", i))));
    HttpResponse::Ok().content_type("text/event-stream").streaming(stream)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("PORT").unwrap_or("3021".into()).parse().unwrap();
    println!("READY");
    HttpServer::new(|| App::new().service(rows).service(action).service(events)).bind(("0.0.0.0", port))?.run().await
}`);

// ---- python fastapi ----
w('py-fastapi/main.py', `import asyncio, json, os, time
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

def make_row(i):
    return {"id": i, "service": f"svc-{i%12}", "region": ["us-east","us-west","eu-central"][i%3], "status": ["ok","warn","err"][i%3], "latency_ms": 20+((i*37)%400), "rps": 100+((i*91)%5000), "updated_at": datetime.fromtimestamp(1752900000+i, tz=timezone.utc).isoformat()}

ROWS = [make_row(i) for i in range(200)]
app = FastAPI()

@app.get("/api/rows")
async def rows():
    return ROWS

@app.post("/api/action")
async def action():
    return {"ok": True, "ts": time.time()}

@app.get("/api/events")
async def events():
    async def gen():
        i = 0
        while True:
            yield f"data: {json.dumps({'seq': i, 'ts': time.time()})}\\n\\n"
            i += 1
            await asyncio.sleep(0.1)
    return StreamingResponse(gen(), media_type="text/event-stream")
`);

// ---- python flask ----
w('py-flask/main.py', `import json, time
from datetime import datetime, timezone
from flask import Flask, Response

def make_row(i):
    return {"id": i, "service": f"svc-{i%12}", "region": ["us-east","us-west","eu-central"][i%3], "status": ["ok","warn","err"][i%3], "latency_ms": 20+((i*37)%400), "rps": 100+((i*91)%5000), "updated_at": datetime.fromtimestamp(1752900000+i, tz=timezone.utc).isoformat()}

ROWS = [make_row(i) for i in range(200)]
app = Flask(__name__)

@app.get("/api/rows")
def rows():
    return ROWS

@app.post("/api/action")
def action():
    return {"ok": True, "ts": time.time()}

@app.get("/api/events")
def events():
    def gen():
        i = 0
        while True:
            yield f"data: {json.dumps({'seq': i, 'ts': time.time()})}\\n\\n"
            i += 1
            time.sleep(0.1)
    return Response(gen(), mimetype="text/event-stream")
`);

// ---- python django ----
w('py-django/app.py', `import json, os, time
from datetime import datetime, timezone
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.urls import path
from django.core.wsgi import get_wsgi_application
from django.views.decorators.csrf import csrf_exempt

settings.configure(DEBUG=False, ROOT_URLCONF=__name__, ALLOWED_HOSTS=["*"], SECRET_KEY="bench")

def make_row(i):
    return {"id": i, "service": f"svc-{i%12}", "region": ["us-east","us-west","eu-central"][i%3], "status": ["ok","warn","err"][i%3], "latency_ms": 20+((i*37)%400), "rps": 100+((i*91)%5000), "updated_at": datetime.fromtimestamp(1752900000+i, tz=timezone.utc).isoformat()}

ROWS = [make_row(i) for i in range(200)]

def rows(request):
    return JsonResponse(ROWS, safe=False)

@csrf_exempt
def action(request):
    return JsonResponse({"ok": True, "ts": time.time()})

def events(request):
    def gen():
        i = 0
        while True:
            yield f"data: {json.dumps({'seq': i, 'ts': time.time()})}\\n\\n"
            i += 1
            time.sleep(0.1)
    return StreamingHttpResponse(gen(), content_type="text/event-stream")

urlpatterns = [path("api/rows", rows), path("api/action", action), path("api/events", events)]
application = get_wsgi_application()
`);

console.log('generated backends');
