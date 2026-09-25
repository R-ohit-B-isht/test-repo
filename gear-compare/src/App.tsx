import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StatusBlock } from './components/ui/primitives';
import { useManifest } from './data/hooks';

const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const PlanPage = lazy(() => import('./pages/PlanPage'));
const SetPage = lazy(() => import('./pages/SetPage'));

/** Landing: the category hub, or — in a single-answer (`mode: 'set'`) build — the one-listing ranking. */
function Landing() {
  const manifest = useManifest();
  if (manifest.status === 'loading') return <StatusBlock title="Loading…" />;
  return manifest.status === 'ready' && manifest.data.mode === 'set' ? <SetPage /> : <HomePage />;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Suspense fallback={<StatusBlock title="Loading…" />}><Landing /></Suspense>} />
          <Route path="set" element={<Suspense fallback={<StatusBlock title="Loading…" />}><SetPage /></Suspense>} />
          <Route path="products" element={<Navigate to="/" replace />} />
          <Route path="c/:id" element={<Suspense fallback={<StatusBlock title="Loading…" />}><CategoryPage /></Suspense>} />
          <Route path="plan" element={<Suspense fallback={<StatusBlock title="Loading…" />}><PlanPage /></Suspense>} />
          <Route path="*" element={<StatusBlock title="Page not found" body="That route does not exist on this site." />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
