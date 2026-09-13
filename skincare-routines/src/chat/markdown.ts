/** Minimal, dependency-free markdown → block model for Gemini answers: paragraphs, headings, lists, tables, inline bold/code/links/citations. */
export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; children: Inline[] }
  | { kind: 'code'; text: string }
  | { kind: 'link'; children: Inline[]; href: string }
  | { kind: 'cite'; id: string };

export type Block =
  | { kind: 'p'; inlines: Inline[] }
  | { kind: 'h'; level: number; inlines: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'table'; header: Inline[][]; rows: Inline[][][] };

const CITE = /\[\[([a-z0-9:_.-]+)\]\]/gi;
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|#)[^)\s]+\)|\[\[[a-z0-9:_.-]+\]\])/gi;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: 'text', text: text.slice(last, i) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ kind: 'bold', children: parseCites(tok.slice(2, -2)) });
    else if (tok.startsWith('`')) out.push({ kind: 'code', text: tok.slice(1, -1) });
    else if (tok.startsWith('[[')) out.push({ kind: 'cite', id: tok.slice(2, -2) });
    else {
      const close = tok.indexOf('](');
      out.push({ kind: 'link', children: parseCites(tok.slice(1, close)), href: tok.slice(close + 2, -1) });
    }
    last = i + tok.length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/** Bold / link text may itself carry `[[id]]` markers (Gemini likes `**Name [[id]]**`); those still have to become pills. */
function parseCites(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: 'text', text: text.slice(last, i) });
    out.push({ kind: 'cite', id: m[1] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isRule = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => parseInline(c.trim()));

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ kind: 'h', level: h[1].length, inlines: parseInline(h[2]) }); i++; continue; }
    if (isRow(line) && i + 1 < lines.length && isRule(lines[i + 1])) {
      const header = cells(line);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && isRow(lines[i])) { rows.push(cells(lines[i])); i++; }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }
    const li = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[1]);
      const items: Inline[][] = [];
      while (i < lines.length) {
        const m = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        let text = m[2];
        while (i + 1 < lines.length && lines[i + 1].trim() && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i + 1]) && !isRow(lines[i + 1]) && !/^#{1,4}\s/.test(lines[i + 1])) { text += ' ' + lines[++i].trim(); }
        items.push(parseInline(text));
        i++;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isRow(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) { buf.push(lines[i]); i++; }
    blocks.push({ kind: 'p', inlines: parseInline(buf.join(' ')) });
  }
  return blocks;
}

/** Ids the answer cites, in order, deduplicated — used to pick which citation cards to show. */
export const citedIds = (text: string) => [...new Set([...text.matchAll(CITE)].map((m) => m[1]))];
