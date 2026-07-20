package main
import ("bufio";"fmt";"os";"time"
	"github.com/gofiber/fiber/v2")
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
	app := fiber.New()
	app.Get("/api/rows", func(c *fiber.Ctx) error { return c.JSON(rows) })
	app.Post("/api/action", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true, "ts": time.Now().UnixMilli()}) })
	app.Get("/api/events", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/event-stream")
		c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
			i := 0
			for {
				fmt.Fprintf(w, "data: {\"seq\":%d,\"ts\":%d}\n\n", i, time.Now().UnixMilli())
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
}