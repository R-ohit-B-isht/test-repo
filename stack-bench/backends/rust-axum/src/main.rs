use axum::{routing::{get, post}, Json, Router, response::sse::{Event, Sse}};
use serde::Serialize;
use std::{convert::Infallible, time::Duration};
use futures::StreamExt;

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
        .map(|(i, _)| Ok(Event::default().data(format!("{{\"seq\":{}}}", i))));
    Sse::new(stream)
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/api/rows", get(rows)).route("/api/action", post(action)).route("/api/events", get(events));
    let port = std::env::var("PORT").unwrap_or("3020".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
    println!("READY");
    axum::serve(listener, app).await.unwrap();
}