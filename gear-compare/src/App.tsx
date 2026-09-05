import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StatusBlock } from './components/ui/primitives';

const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Suspense fallback={<StatusBlock title="Loading…" />}><HomePage /></Suspense>} />
          <Route path="products" element={<Navigate to="/" replace />} />
          <Route path="c/:id" element={<Suspense fallback={<StatusBlock title="Loading…" />}><CategoryPage /></Suspense>} />
          <Route path="*" element={<StatusBlock title="Page not found" body="That route does not exist on this site." />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
