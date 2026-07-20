export const handler = {
  GET() {
    const enc = new TextEncoder();
    let t: number;
    const stream = new ReadableStream({
      start(ctrl) {
        let i = 0;
        t = setInterval(() => {
          try { ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ seq: i++, ts: Date.now() })}\n\n`)); } catch { clearInterval(t); }
        }, 100);
      },
      cancel() { clearInterval(t); },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
  },
};
