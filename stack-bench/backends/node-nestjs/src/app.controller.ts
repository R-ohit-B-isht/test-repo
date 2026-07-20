import { Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';

function makeRow(i: number) {
  return { id: i, service: `svc-${i % 12}`, region: ['us-east', 'us-west', 'eu-central'][i % 3], status: ['ok', 'warn', 'err'][i % 3], latency_ms: 20 + ((i * 37) % 400), rps: 100 + ((i * 91) % 5000), updated_at: new Date(1752900000000 + i * 1000).toISOString() };
}
const ROWS = Array.from({ length: 200 }, (_, i) => makeRow(i));

@Controller('api')
export class AppController {
  @Get('rows')
  rows() { return ROWS; }

  @Post('action')
  action() { return { ok: true, ts: Date.now() }; }

  @Get('events')
  events(@Res() res: Response) {
    res.set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    let i = 0;
    const t = setInterval(() => { res.write(`data: ${JSON.stringify({ seq: i++, ts: Date.now() })}\n\n`); }, 100);
    res.on('close', () => clearInterval(t));
  }
}
