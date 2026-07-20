import { render, Component } from 'inferno';
import { createElement as h } from 'inferno-create-element';
import { COLS, getN, sortRows, wireCommon, markReady } from './shared.js';
class Table extends Component {
  constructor(p) { super(p); this.state = { rows: [], key: 'id', dir: 1 }; }
  componentDidMount() {
    fetch('/api/rows?n=' + getN()).then(r => r.json()).then(d => { this.setState({ rows: d }); requestAnimationFrame(() => markReady()); });
    wireCommon(ev => this.setState(s => ({ rows: s.rows.map(r => r.id === ev.row_id ? { ...r, latency_ms: ev.latency_ms, status: ev.status } : r) })));
  }
  render() {
    const { rows, key, dir } = this.state;
    const sorted = sortRows(rows, key, dir);
    return h('table', null, [
      h('tr', { key: 'h' }, COLS.map(c => h('th', { key: c, onClick: () => this.setState({ dir: key === c ? -dir : 1, key: c }) }, c))),
      sorted.map(r => h('tr', { key: r.id }, COLS.map(c => h('td', { key: c }, String(r[c])))))
    ]);
  }
}
render(h(Table), document.getElementById('app'));
