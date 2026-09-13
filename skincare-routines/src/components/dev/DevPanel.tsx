import { Fragment, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDevInfo } from './devStore';

function useViewport() {
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vw;
}

/** ?dev=1 diagnostics overlay — hidden entirely in normal mode. */
export function DevPanel() {
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const info = useDevInfo();
  const vw = useViewport();
  const [open, setOpen] = useState(true);
  if (params.get('dev') !== '1') return null;
  const bp = vw < 640 ? 'xs' : vw < 768 ? 'sm' : vw < 1024 ? 'md' : vw < 1280 ? 'lg' : vw < 1536 ? 'xl' : '2xl';
  return (
    <aside aria-label="Developer panel" className="card fixed bottom-3 left-3 z-[70] max-w-[min(92vw,420px)] !border-warning/60 p-3 font-mono text-[11px] text-primary shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-warning">DEV MODE</span>
        <button type="button" className="font-bold text-secondary hover:text-primary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'hide' : 'show'}</button>
      </div>
      {open && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-all">
          <dt className="text-muted">route</dt><dd>{pathname}{search}</dd>
          <dt className="text-muted">viewport</dt><dd>{vw}px · {bp}</dd>
          {Object.entries(info).map(([k, v]) => (
            <Fragment key={k}><dt className="text-muted">{k}</dt><dd>{String(v)}</dd></Fragment>
          ))}
        </dl>
      )}
    </aside>
  );
}
