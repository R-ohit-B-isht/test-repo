import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLS = ['id', 'service', 'region', 'status', 'latency_ms', 'rps', 'updated_at'];
declare global { interface Window { __benchReady: boolean; __tableRenderedAt: number; } }

@Component({
  selector: 'app-root',
  template: `
    <div style="font-family:system-ui;background:#111;color:#eee">
    <h1>angular console</h1>
    <button (click)="act()">Run action</button> <span>{{ actres }}</span>
    <ul><li *ngFor="let e of feed">{{ e }}</li></ul>
    <table><tbody>
      <tr><th *ngFor="let c of cols" (click)="sortBy(c)" style="cursor:pointer">{{ c }}</th></tr>
      <tr *ngFor="let r of sorted(); trackBy: trackId"><td *ngFor="let c of cols">{{ r[c] }}</td></tr>
    </tbody></table>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule],
})
export class AppComponent implements OnInit {
  cols = COLS;
  rows: any[] = [];
  key = 'id';
  dir = 1;
  feed: string[] = [];
  actres = '';
  constructor(private zone: NgZone) {}
  ngOnInit() {
    const n = parseInt(new URLSearchParams(location.search).get('n') || '200', 10);
    fetch('/api/rows?n=' + n).then((r) => r.json()).then((d) => {
      this.zone.run(() => { this.rows = d; });
      requestAnimationFrame(() => { window.__benchReady = true; window.__tableRenderedAt = performance.now(); });
    });
    const es = new EventSource('/api/events');
    es.onmessage = (e) => this.zone.run(() => {
      const ev = JSON.parse(e.data);
      this.feed.unshift(ev.seq + ' ' + ev.status + ' ' + ev.msg);
      if (this.feed.length > 20) this.feed.pop();
      const r = this.rows.find((x) => x.id === ev.row_id);
      if (r) { r.latency_ms = ev.latency_ms; r.status = ev.status; }
    });
  }
  sortBy(c: string) { this.dir = this.key === c ? -this.dir : 1; this.key = c; }
  sorted() { const k = this.key, d = this.dir; return [...this.rows].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * d); }
  trackId(_: number, r: any) { return r.id; }
  async act() {
    const r = await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd: 'restart' }) });
    this.actres = JSON.stringify(await r.json());
  }
}
