use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::Serialize;
use std::time::Duration;
use futures::StreamExt;

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
        .map(|(i, _)| Ok::<_, std::convert::Infallible>(web::Bytes::from(format!("data: {{\"seq\":{}}}\n\n", i))));
    HttpResponse::Ok().content_type("text/event-stream").streaming(stream)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("PORT").unwrap_or("3021".into()).parse().unwrap();
    println!("READY");
    HttpServer::new(|| App::new().service(rows).service(action).service(events)).bind(("0.0.0.0", port))?.run().await
}