import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

// Static hosting has no SPA fallback, so routes live in the hash; fold a plain `?dev=1` into it.
const { search, hash, pathname } = window.location;
if (search) {
  const [route, hashQuery] = hash.replace(/^#/, '').split('?');
  const merged = new URLSearchParams(hashQuery ?? '');
  new URLSearchParams(search).forEach((v, k) => merged.set(k, v));
  window.history.replaceState(null, '', `${pathname}#${route || '/'}?${merged}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
