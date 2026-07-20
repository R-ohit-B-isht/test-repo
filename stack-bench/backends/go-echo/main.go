package main
import ("fmt";"net/http";"os";"time"
	"github.com/labstack/echo/v4")
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
				fmt.Fprintf(c.Response(), "data: {\"seq\":%d,\"ts\":%d}\n\n", i, time.Now().UnixMilli())
				i++
				c.Response().Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3012" }
	fmt.Println("READY")
	e.Start(":" + port)
}