package bench.vertx;

import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import java.time.Instant;

public class Main {
  static final String[] REGIONS = { "us-east", "us-west", "eu-central" };
  static final String[] STATUSES = { "ok", "warn", "err" };

  static JsonArray makeRows() {
    JsonArray rows = new JsonArray();
    for (int i = 0; i < 200; i++) {
      rows.add(new JsonObject()
          .put("id", i)
          .put("service", "svc-" + (i % 12))
          .put("region", REGIONS[i % 3])
          .put("status", STATUSES[i % 3])
          .put("latency_ms", 20 + ((i * 37) % 400))
          .put("rps", 100 + ((i * 91) % 5000))
          .put("updated_at", Instant.ofEpochMilli(1752900000000L + (long) i * 1000).toString()));
    }
    return rows;
  }

  public static void main(String[] args) {
    Vertx vertx = Vertx.vertx();
    Router router = Router.router(vertx);
    String rowsJson = makeRows().encode();

    router.get("/api/rows").handler(ctx -> ctx.response().putHeader("content-type", "application/json").end(rowsJson));
    router.post("/api/action").handler(ctx -> ctx.response().putHeader("content-type", "application/json")
        .end(new JsonObject().put("ok", true).put("ts", System.currentTimeMillis()).encode()));
    router.get("/api/events").handler(ctx -> {
      ctx.response().putHeader("content-type", "text/event-stream").putHeader("cache-control", "no-cache").setChunked(true);
      final long[] seq = { 0 };
      long timer = vertx.setPeriodic(100, id -> {
        if (ctx.response().closed()) { vertx.cancelTimer(id); return; }
        ctx.response().write("data: {\"seq\":" + seq[0]++ + ",\"ts\":" + System.currentTimeMillis() + "}\n\n");
      });
      ctx.response().closeHandler(v -> vertx.cancelTimer(timer));
    });

    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3063"));
    vertx.createHttpServer().requestHandler(router).listen(port).onSuccess(s -> System.out.println("READY"));
  }
}
