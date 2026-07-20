package main
import ("encoding/json";"fmt";"net/http";"os";"time")
type Row struct {
	ID int `json:"id"`
	Service string `json:"service"`
	Region string `json:"region"`
	Status string `json:"status"`
	LatencyMs int `json:"latency_ms"`
	RPS int `json:"rps"`
	UpdatedAt string `json:"updated_at"`
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
var rows = makeRows()
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
				fmt.Fprintf(w, "data: {\"seq\":%d,\"ts\":%d}\n\n", i, time.Now().UnixMilli())
				i++
				f.Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3010" }
	fmt.Println("READY")
	http.ListenAndServe(":"+port, nil)
}