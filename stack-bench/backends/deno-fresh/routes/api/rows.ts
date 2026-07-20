function makeRow(i: number) {
  return { id: i, service: `svc-${i % 12}`, region: ["us-east", "us-west", "eu-central"][i % 3], status: ["ok", "warn", "err"][i % 3], latency_ms: 20 + ((i * 37) % 400), rps: 100 + ((i * 91) % 5000), updated_at: new Date(1752900000000 + i * 1000).toISOString() };
}
const ROWS = Array.from({ length: 200 }, (_, i) => makeRow(i));

export const handler = {
  GET() {
    return new Response(JSON.stringify(ROWS), { headers: { "content-type": "application/json" } });
  },
};
