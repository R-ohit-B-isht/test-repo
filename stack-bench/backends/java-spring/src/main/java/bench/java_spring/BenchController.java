package bench.java_spring;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
public class BenchController {
  private static final String[] REGIONS = { "us-east", "us-west", "eu-central" };
  private static final String[] STATUSES = { "ok", "warn", "err" };
  private static final List<Map<String, Object>> ROWS = makeRows();

  private static List<Map<String, Object>> makeRows() {
    List<Map<String, Object>> rows = new ArrayList<>();
    for (int i = 0; i < 200; i++) {
      Map<String, Object> r = new LinkedHashMap<>();
      r.put("id", i);
      r.put("service", "svc-" + (i % 12));
      r.put("region", REGIONS[i % 3]);
      r.put("status", STATUSES[i % 3]);
      r.put("latency_ms", 20 + ((i * 37) % 400));
      r.put("rps", 100 + ((i * 91) % 5000));
      r.put("updated_at", Instant.ofEpochMilli(1752900000000L + (long) i * 1000).toString());
      rows.add(r);
    }
    return rows;
  }

  @GetMapping("/rows")
  public List<Map<String, Object>> rows() { return ROWS; }

  @PostMapping("/action")
  public Map<String, Object> action() { return Map.of("ok", true, "ts", System.currentTimeMillis()); }

  @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter events() {
    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
    Thread t = new Thread(() -> {
      int i = 0;
      try {
        while (true) {
          emitter.send("{\"seq\":" + i + ",\"ts\":" + System.currentTimeMillis() + "}");
          i++;
          Thread.sleep(100);
        }
      } catch (Exception e) {
        emitter.complete();
      }
    });
    t.setDaemon(true);
    t.start();
    return emitter;
  }
}
