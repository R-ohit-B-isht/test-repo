package main

// Echo + Postgres: /api/rows-pgx (pgx pool) vs /api/rows-sql (database/sql + lib/pq)
// querying the same 200-row table from a real Postgres.
import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"

	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

type Row struct {
	ID        int    `json:"id"`
	Service   string `json:"service"`
	Region    string `json:"region"`
	Status    string `json:"status"`
	LatencyMs int    `json:"latency_ms"`
	RPS       int    `json:"rps"`
	UpdatedAt string `json:"updated_at"`
}

const dsn = "postgres://bench:bench@127.0.0.1:5433/bench?sslmode=disable"

func seed(pool *pgxpool.Pool) {
	ctx := context.Background()
	pool.Exec(ctx, `DROP TABLE IF EXISTS rows_t`)
	pool.Exec(ctx, `CREATE TABLE rows_t (id int primary key, service text, region text, status text, latency_ms int, rps int, updated_at timestamptz)`)
	regions := []string{"us-east", "us-west", "eu-central"}
	statuses := []string{"ok", "warn", "err"}
	for i := 0; i < 200; i++ {
		pool.Exec(ctx, `INSERT INTO rows_t VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			i, fmt.Sprintf("svc-%d", i%12), regions[i%3], statuses[i%3], 20+((i*37)%400), 100+((i*91)%5000), time.UnixMilli(1752900000000+int64(i)*1000).UTC())
	}
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		panic(err)
	}
	seed(pool)
	sqldb, err := sql.Open("postgres", dsn)
	if err != nil {
		panic(err)
	}
	sqldb.SetMaxOpenConns(16)

	q := `SELECT id, service, region, status, latency_ms, rps, updated_at FROM rows_t ORDER BY id`
	scanRows := func(next func() bool, scan func(dest ...any) error) []Row {
		out := make([]Row, 0, 200)
		for next() {
			var r Row
			var t time.Time
			scan(&r.ID, &r.Service, &r.Region, &r.Status, &r.LatencyMs, &r.RPS, &t)
			r.UpdatedAt = t.UTC().Format(time.RFC3339)
			out = append(out, r)
		}
		return out
	}

	e := echo.New()
	e.HideBanner = true
	e.GET("/api/rows-pgx", func(c echo.Context) error {
		rs, err := pool.Query(c.Request().Context(), q)
		if err != nil {
			return err
		}
		defer rs.Close()
		return c.JSON(http.StatusOK, scanRows(rs.Next, rs.Scan))
	})
	e.GET("/api/rows-sql", func(c echo.Context) error {
		rs, err := sqldb.QueryContext(c.Request().Context(), q)
		if err != nil {
			return err
		}
		defer rs.Close()
		return c.JSON(http.StatusOK, scanRows(rs.Next, rs.Scan))
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "3070"
	}
	e.Start(":" + port)
}
