import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

const COLS = ['id', 'service', 'region', 'status', 'latency_ms', 'rps', 'updated_at'];

export default class ApplicationController extends Controller {
  cols = COLS;
  @tracked rows = [];
  @tracked key = 'id';
  @tracked dir = 1;
  @tracked feed = [];
  @tracked actres = '';

  constructor() {
    super(...arguments);
    const n = parseInt(new URLSearchParams(location.search).get('n') || '200', 10);
    fetch('/api/rows?n=' + n).then((r) => r.json()).then((d) => {
      this.rows = d;
      requestAnimationFrame(() => { window.__benchReady = true; window.__tableRenderedAt = performance.now(); });
    });
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      const ev = JSON.parse(e.data);
      this.feed = [ev.seq + ' ' + ev.status + ' ' + ev.msg, ...this.feed].slice(0, 20);
      this.rows = this.rows.map((r) => (r.id === ev.row_id ? { ...r, latency_ms: ev.latency_ms, status: ev.status } : r));
    };
  }

  get sorted() {
    const k = this.key, d = this.dir;
    return [...this.rows].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * d);
  }

  @action sortBy(c) { this.dir = this.key === c ? -this.dir : 1; this.key = c; }

  @action async act() {
    const r = await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd: 'restart' }) });
    this.actres = JSON.stringify(await r.json());
  }
}
