import {LitElement,html} from 'lit';import {repeat} from 'lit/directives/repeat.js';
import {COLS,getN,sortRows,wireCommon,markReady} from './shared.js';
class BenchTable extends LitElement{
static properties={rows:{state:true},key:{state:true},dir:{state:true}};
createRenderRoot(){return this;}
constructor(){super();this.rows=[];this.key='id';this.dir=1;}
connectedCallback(){super.connectedCallback();
fetch('/api/rows?n='+getN()).then(r=>r.json()).then(d=>{this.rows=d;requestAnimationFrame(()=>markReady());});
wireCommon(ev=>{this.rows=this.rows.map(r=>r.id===ev.row_id?{...r,latency_ms:ev.latency_ms,status:ev.status}:r);});}
render(){const sorted=sortRows(this.rows,this.key,this.dir);
return html`<table><tr>${COLS.map(c=>html`<th @click=${()=>{this.dir=this.key===c?-this.dir:1;this.key=c;}}>${c}</th>`)}</tr>
${repeat(sorted,r=>r.id,r=>html`<tr>${COLS.map(c=>html`<td>${r[c]}</td>`)}</tr>`)}</table>`;}}
customElements.define('bench-table',BenchTable);
document.getElementById('app').appendChild(document.createElement('bench-table'));