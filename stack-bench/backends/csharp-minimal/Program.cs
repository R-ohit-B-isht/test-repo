var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
var app = builder.Build();

string[] regions = { "us-east", "us-west", "eu-central" };
string[] statuses = { "ok", "warn", "err" };
var rows = Enumerable.Range(0, 200).Select(i => new
{
    id = i,
    service = $"svc-{i % 12}",
    region = regions[i % 3],
    status = statuses[i % 3],
    latency_ms = 20 + ((i * 37) % 400),
    rps = 100 + ((i * 91) % 5000),
    updated_at = DateTimeOffset.FromUnixTimeMilliseconds(1752900000000 + (long)i * 1000).UtcDateTime.ToString("o"),
}).ToArray();

app.MapGet("/api/rows", () => rows);
app.MapPost("/api/action", () => new { ok = true, ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
app.MapGet("/api/events", async (HttpContext ctx) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    var i = 0;
    while (!ctx.RequestAborted.IsCancellationRequested)
    {
        await ctx.Response.WriteAsync($"data: {{\"seq\":{i},\"ts\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}}}\n\n");
        await ctx.Response.Body.FlushAsync();
        i++;
        try { await Task.Delay(100, ctx.RequestAborted); } catch { break; }
    }
});

Console.WriteLine("READY");
app.Run($"http://0.0.0.0:{Environment.GetEnvironmentVariable("PORT") ?? "3050"}");
