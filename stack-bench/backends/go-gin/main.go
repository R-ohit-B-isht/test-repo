package main
import ("fmt";"os";"time"
	"github.com/gin-gonic/gin")
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
				fmt.Fprintf(c.Writer, "data: {\"seq\":%d,\"ts\":%d}\n\n", i, time.Now().UnixMilli())
				i++
				c.Writer.Flush()
			}
		}
	})
	port := os.Getenv("PORT")
	if port == "" { port = "3013" }
	fmt.Println("READY")
	r.Run(":" + port)
}