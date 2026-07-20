import json, os, time
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
            yield f"data: {json.dumps({'seq': i, 'ts': time.time()})}\n\n"
            i += 1
            time.sleep(0.1)
    return StreamingHttpResponse(gen(), content_type="text/event-stream")

urlpatterns = [path("api/rows", rows), path("api/action", action), path("api/events", events)]
application = get_wsgi_application()
