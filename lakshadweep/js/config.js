// Runtime flags. Static site, so "environment variables" are URL params or
// localStorage. Enable developer mode with ?dev=1, localStorage IS_DEV=true,
// or the D key.

const params = new URLSearchParams(location.search);

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export const IS_DEV = params.get('dev') === '1' || stored('IS_DEV') === 'true';
