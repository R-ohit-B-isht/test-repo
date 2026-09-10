import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { parseMarkdown, type Block, type Inline } from '../../chat/markdown';
import type { CitedCategory, CitedProduct } from '../../chat/types';

export interface CiteIndex { products: Map<string, CitedProduct>; categories: Map<string, CitedCategory> }

interface Props { text: string; cites: CiteIndex; onNavigate: () => void }

/** Renders a Gemini answer. `[[id]]` markers become pills that deep-link to the listing / category the tools actually returned. */
export function Markdown({ text, cites, onNavigate }: Props) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <div className="chat-md">
      {blocks.map((b, i) => <BlockView key={i} block={b} cites={cites} onNavigate={onNavigate} />)}
    </div>
  );
}

function BlockView({ block, cites, onNavigate }: { block: Block; cites: CiteIndex; onNavigate: () => void }) {
  const inl = (xs: Inline[]) => <Inlines inlines={xs} cites={cites} onNavigate={onNavigate} />;
  switch (block.kind) {
    case 'h': return <p className={clsx('mt-3 font-extrabold text-display', block.level <= 2 ? 'text-[15px]' : 'text-[14px]')}>{inl(block.inlines)}</p>;
    case 'list':
      return block.ordered
        ? <ol className="my-1.5 list-decimal space-y-1 pl-5">{block.items.map((it, i) => <li key={i}>{inl(it)}</li>)}</ol>
        : <ul className="my-1.5 list-disc space-y-1 pl-5">{block.items.map((it, i) => <li key={i}>{inl(it)}</li>)}</ul>;
    case 'table':
      return (
        <div className="scrollbar-thin my-2 -mx-1 overflow-x-auto rounded-[10px] border border-line">
          <table className="w-full border-collapse text-[12.5px]">
            <thead><tr className="bg-raised">{block.header.map((c, i) => <th key={i} className="label whitespace-nowrap px-2.5 py-1.5 text-left">{inl(c)}</th>)}</tr></thead>
            <tbody>{block.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="px-2.5 py-1.5 align-top">{inl(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    default: return <p className="my-1.5">{inl(block.inlines)}</p>;
  }
}

function Inlines({ inlines, cites, onNavigate }: { inlines: Inline[]; cites: CiteIndex; onNavigate: () => void }) {
  return <>{inlines.map((x, i) => <InlineView key={i} x={x} cites={cites} onNavigate={onNavigate} />)}</>;
}

function InlineView({ x, cites, onNavigate }: { x: Inline; cites: CiteIndex; onNavigate: () => void }) {
  switch (x.kind) {
    case 'bold': return <strong className="font-bold text-display">{x.text}</strong>;
    case 'code': return <code className="mono rounded bg-raised px-1 text-[12px]">{x.text}</code>;
    case 'link': return <a href={x.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2">{x.text}</a>;
    case 'cite': return <CitePill id={x.id} cites={cites} onNavigate={onNavigate} />;
    default: return <>{x.text}</>;
  }
}

/** Perplexity-style inline source pill. Unknown ids are shown as plain text so nothing links to an unverified product. */
function CitePill({ id, cites, onNavigate }: { id: string; cites: CiteIndex; onNavigate: () => void }) {
  const cat = id.startsWith('cat:') ? cites.categories.get(id.slice(4)) : null;
  if (cat) return <Link to={`/c/${cat.id}`} onClick={onNavigate} className="chat-cite" title={`Open ${cat.label ?? cat.id}`}>{cat.label ?? cat.id}</Link>;
  const p = cites.products.get(id);
  if (p) {
    return (
      <Link to={`/c/${p.category}?open=${encodeURIComponent(p.id)}`} onClick={onNavigate} className="chat-cite" title={`${p.brand} ${p.title}`}>
        {p.rank != null ? `#${p.rank}` : p.brand}
      </Link>
    );
  }
  return <span className="chat-cite chat-cite-unverified" title="Not returned by any site tool in this answer">unverified</span>;
}
