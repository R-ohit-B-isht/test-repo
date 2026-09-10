import type { AssistantMessage } from '../../chat/types';

/** Developer-only (?dev=1) trace of the Gemini turn: model, dataset version, every tool call with timing and payload size. */
export function ToolTrace({ m }: { m: AssistantMessage }) {
  const total = m.endedAt ? Math.round(m.endedAt - m.startedAt) : null;
  return (
    <details className="mt-2 rounded-[10px] border border-dashed border-line-strong bg-raised/60 px-3 py-2 text-[11.5px]">
      <summary className="mono cursor-pointer select-none font-bold text-secondary">
        dev · {m.tools.length} tool call{m.tools.length === 1 ? '' : 's'}{total != null && ` · ${total} ms`}{m.meta?.model && ` · ${m.meta.model}`}
      </summary>
      <dl className="mono mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-secondary">
        <dt>data version</dt><dd className="break-all">{m.meta?.dataVersion ?? '—'}</dd>
        <dt>listings</dt><dd>{m.meta?.listings?.toLocaleString('en-IN') ?? '—'}</dd>
        <dt>phase</dt><dd>{m.phase}{m.error ? ` · ${m.error.code}` : ''}</dd>
        <dt>unverified cites</dt><dd>{m.unverified.length ? m.unverified.join(', ') : 'none'}</dd>
      </dl>
      {m.tools.length > 0 && (
        <ol className="mono mt-2 space-y-1 border-t border-line pt-2">
          {m.tools.map((t, i) => (
            <li key={i} className="break-all">
              <span className="font-bold text-display">{t.name}</span>
              <span className="text-muted">({JSON.stringify(t.args)})</span>
              {t.ms != null && <span className="text-secondary"> → {t.ms} ms · {formatBytes(t.bytes ?? 0)}{t.count != null ? ` · ${t.count} rows` : ''}</span>}
              {t.error && <span className="text-danger"> · {t.error}</span>}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}

const formatBytes = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1)} kB` : `${n} B`);
