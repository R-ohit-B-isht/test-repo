import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StatusBlock } from './components/ui/primitives';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsHubPage = lazy(() => import('./pages/ProductsHubPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Suspense fallback={<StatusBlock title="Loading…" />}><HomePage /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<StatusBlock title="Loading…" />}><ProductsHubPage /></Suspense>} />
          <Route path="c/:id" element={<Suspense fallback={<StatusBlock title="Loading…" />}><CategoryPage /></Suspense>} />
          <Route path="*" element={<StatusBlock title="Page not found" body="That route does not exist on this site." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
