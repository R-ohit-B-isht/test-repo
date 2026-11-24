import { lazy, Suspense } from 'react';
import { HashRouter, Link, Outlet, Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));

function Shell() {
  return (
    <div className="min-h-dvh bg-[var(--page)] text-[var(--primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--page)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link to="/" className="text-[17px] font-extrabold tracking-tight text-[var(--display)]">Kit Ledger</Link>
          <nav className="flex gap-1 text-[14px] font-bold">
            <Link to="/browse" className="rounded-full px-3 py-1.5 hover:bg-[var(--raised)]">All products</Link>
            <Link to="/browse?dept=Footwear" className="hidden rounded-full px-3 py-1.5 hover:bg-[var(--raised)] sm:block">Footwear</Link>
            <Link to="/browse?dept=Clothing" className="hidden rounded-full px-3 py-1.5 hover:bg-[var(--raised)] sm:block">Clothing</Link>
            <Link to="/browse?dept=Accessories" className="hidden rounded-full px-3 py-1.5 hover:bg-[var(--raised)] md:block">Accessories</Link>
            <Link to="/browse?dept=Equipment" className="hidden rounded-full px-3 py-1.5 hover:bg-[var(--raised)] md:block">Equipment</Link>
          </nav>
          <span className="ml-auto hidden text-[12px] text-[var(--muted)] lg:block">Ranked on quality only. Price is shown but never scored.</span>
        </div>
      </header>
      <Suspense fallback={<p className="p-8 text-[var(--muted)]">Loading…</p>}><Outlet /></Suspense>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="*" element={<p className="p-8">Page not found.</p>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
