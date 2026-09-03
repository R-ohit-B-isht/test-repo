import { Outlet, useLocation } from 'react-router-dom';
import { AppNavLink as NavLink } from '../ui/AppLink';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useManifest } from '../../data/hooks';
import { DevPanel } from '../dev/DevPanel';

const NAV = [
  { to: '/', label: 'Routines', end: true },
  { to: '/products', label: 'Products' },
  { to: '/c/pigmentation', label: 'Pigmentation protocol' },
];

export function AppShell() {
  const manifest = useManifest();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return (
    <div className="min-h-dvh">
      <button type="button" onClick={() => document.getElementById('main')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-black">Skip to content</button>
      <header className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="dot" aria-hidden />
            <span className="mono text-[12px] tracking-[0.12em] text-display">SKIN·INDIA</span>
          </NavLink>
          <nav aria-label="Primary" className="scrollbar-thin flex min-w-0 gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => clsx('label press whitespace-nowrap rounded px-3 py-2 transition-colors hover:text-primary', isActive && 'bg-raised !text-display')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none mx-auto max-w-[1440px] px-4 pb-24 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 text-[12px] text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Every product is a real listing captured live from Flipkart or Amazon.in. Unknown fields say so. Seller claims are labelled as claims — nothing here is lab-tested or medical advice.
          </p>
          {manifest.status === 'ready' && (
            <p className="mono shrink-0">{manifest.data.total.toLocaleString('en-IN')} listings · {manifest.data.routines.count} routines · data {manifest.data.generatedAt.slice(0, 10)}</p>
          )}
        </div>
      </footer>
      <DevPanel />
    </div>
  );
}
