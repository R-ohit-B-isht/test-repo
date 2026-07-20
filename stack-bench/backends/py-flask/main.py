import json, time
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
            yield f"data: {json.dumps({'seq': i, 'ts': time.time()})}\n\n"
            i += 1
            time.sleep(0.1)
    return Response(gen(), mimetype="text/event-stream")
