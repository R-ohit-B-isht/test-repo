package main

// Backend-library benchmark service (Echo):
//  JSON encoders:   /api/rows-std  /api/rows-gojson  /api/rows-sonic
//  Middleware cost: /api/rows-mw (Logger+Recover+Gzip on subgroup)
//  Validation:      /api/action-validated (go-playground/validator)
//  DB layers:       /api/db-pgx  /api/db-pgx-prepared  /api/db-sqlx  /api/db-gorm
//  Realtime:        /api/events-pg (Postgres LISTEN/NOTIFY -> SSE, payload carries send ns)
//                   /ws (WebSocket 10Hz) vs /api/events (SSE 10Hz)
import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	gojson "github.com/goccy/go-json"
	"github.com/bytedance/sonic"
	"github.com/go-playground/validator/v10"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	glogger "gorm.io/gorm/logger"
)

type Row struct {
	ID        int    `json:"id" db:"id" gorm:"column:id;primaryKey"`
	Service   string `json:"service" db:"service" gorm:"column:service"`
	Region    string `json:"region" db:"region" gorm:"column:region"`
	Status    string `json:"status" db:"status" gorm:"column:status"`
	LatencyMs int    `json:"latency_ms" db:"latency_ms" gorm:"column:latency_ms"`
	RPS       int    `json:"rps" db:"rps" gorm:"column:rps"`
	UpdatedAt string `json:"updated_at" db:"-" gorm:"-"`
}

type RowT struct {
	Row
	UpdatedAtT time.Time `json:"-" db:"updated_at" gorm:"column:updated_at"`
}

func (RowT) TableName() string { return "rows_t" }

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

type Action struct {
	Cmd    string `json:"cmd" validate:"required,oneof=restart stop scale"`
	Target string `json:"target" validate:"required,min=1,max=64"`
	Count  int    `json:"count" validate:"gte=0,lte=100"`
}

const dsn = "postgres://bench:bench@127.0.0.1:5433/bench?sslmode=disable"
const pgxDsn = dsn + "&pool_max_conns=80"
const q = `SELECT id, service, region, status, latency_ms, rps, updated_at FROM rows_t ORDER BY id`

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, pgxDsn)
	if err != nil {
		panic(err)
	}
	sqlxdb, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		panic(err)
	}
	sqlxdb.SetMaxOpenConns(16)
	gdb, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: glogger.Discard, PrepareStmt: true})
	if err != nil {
		panic(err)
	}
	if sqldb, err := gdb.DB(); err == nil {
		sqldb.SetMaxOpenConns(16)
	}
	validate := validator.New()

	e := echo.New()
	e.HideBanner = true

	// JSON encoders (in-memory rows)
	e.GET("/api/rows-std", func(c echo.Context) error {
		b, _ := json.Marshal(rows)
		return c.Blob(http.StatusOK, "application/json", b)
	})
	e.GET("/api/rows-gojson", func(c echo.Context) error {
		b, _ := gojson.Marshal(rows)
		return c.Blob(http.StatusOK, "application/json", b)
	})
	e.GET("/api/rows-sonic", func(c echo.Context) error {
		b, _ := sonic.Marshal(rows)
		return c.Blob(http.StatusOK, "application/json", b)
	})

	// middleware-stacked group (std encoder)
	g := e.Group("/mw")
	logOut, _ := os.OpenFile("/dev/null", os.O_WRONLY, 0)
	g.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{Output: logOut}), middleware.Recover(), middleware.Gzip())
	g.GET("/api/rows-mw", func(c echo.Context) error {
		b, _ := json.Marshal(rows)
		return c.Blob(http.StatusOK, "application/json", b)
	})

	// validation
	e.POST("/api/action-validated", func(c echo.Context) error {
		var a Action
		if err := c.Bind(&a); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if err := validate.Struct(&a); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]any{"ok": true, "ts": time.Now().UnixMilli()})
	})

	// DB layers
	scanPgx := func(c echo.Context, prepared bool) error {
		rs, err := pool.Query(c.Request().Context(), q)
		if err != nil {
			return err
		}
		defer rs.Close()
		out := make([]Row, 0, 200)
		for rs.Next() {
			var r Row
			var t time.Time
			rs.Scan(&r.ID, &r.Service, &r.Region, &r.Status, &r.LatencyMs, &r.RPS, &t)
			r.UpdatedAt = t.UTC().Format(time.RFC3339)
			out = append(out, r)
		}
		return c.JSON(http.StatusOK, out)
	}
	e.GET("/api/db-pgx", func(c echo.Context) error { return scanPgx(c, false) })
	e.GET("/api/db-pgx-prepared", func(c echo.Context) error { return scanPgx(c, true) }) // pgxpool auto-prepares/caches statements
	e.GET("/api/db-sqlx", func(c echo.Context) error {
		var out []RowT
		if err := sqlxdb.SelectContext(c.Request().Context(), &out, q); err != nil {
			return err
		}
		res := make([]Row, len(out))
		for i, r := range out {
			r.Row.UpdatedAt = r.UpdatedAtT.UTC().Format(time.RFC3339)
			res[i] = r.Row
		}
		return c.JSON(http.StatusOK, res)
	})
	e.GET("/api/db-gorm", func(c echo.Context) error {
		var out []RowT
		if err := gdb.WithContext(c.Request().Context()).Order("id").Find(&out).Error; err != nil {
			return err
		}
		res := make([]Row, len(out))
		for i, r := range out {
			r.Row.UpdatedAt = r.UpdatedAtT.UTC().Format(time.RFC3339)
			res[i] = r.Row
		}
		return c.JSON(http.StatusOK, res)
	})

	// SSE 10Hz (plain)
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
				fmt.Fprintf(c.Response(), "data: {\"seq\":%d,\"sent_ns\":%d}\n\n", i, time.Now().UnixNano())
				c.Response().Flush()
				i++
			}
		}
	})

	// WebSocket 10Hz
	up := websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	e.GET("/ws", func(c echo.Context) error {
		ws, err := up.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			return err
		}
		defer ws.Close()
		i := 0
		t := time.NewTicker(100 * time.Millisecond)
		defer t.Stop()
		for range t.C {
			msg := fmt.Sprintf("{\"seq\":%d,\"sent_ns\":%d}", i, time.Now().UnixNano())
			if err := ws.WriteMessage(websocket.TextMessage, []byte(msg)); err != nil {
				return nil
			}
			i++
		}
		return nil
	})

	// Postgres LISTEN/NOTIFY -> SSE. A ticker goroutine NOTIFYs 'events' with sent_ns; each SSE conn LISTENs.
	go func() {
		conn, err := pool.Acquire(ctx)
		if err != nil {
			return
		}
		defer conn.Release()
		i := 0
		for range time.Tick(100 * time.Millisecond) {
			conn.Exec(ctx, "SELECT pg_notify('events', $1)", fmt.Sprintf("{\"seq\":%d,\"sent_ns\":%d}", i, time.Now().UnixNano()))
			i++
		}
	}()
	e.GET("/api/events-pg", func(c echo.Context) error {
		c.Response().Header().Set("Content-Type", "text/event-stream")
		c.Response().WriteHeader(http.StatusOK)
		conn, err := pool.Acquire(c.Request().Context())
		if err != nil {
			return err
		}
		defer conn.Release()
		if _, err := conn.Exec(c.Request().Context(), "LISTEN events"); err != nil {
			return err
		}
		for {
			n, err := conn.Conn().WaitForNotification(c.Request().Context())
			if err != nil {
				return nil
			}
			fmt.Fprintf(c.Response(), "data: %s\n\n", n.Payload)
			c.Response().Flush()
		}
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3071"
	}
	_ = strconv.Itoa
	e.Start(":" + port)
}
