import { Link, NavLink, useSearchParams, type LinkProps, type NavLinkProps } from 'react-router-dom';

/** Keeps the ?dev=1 flag while navigating so diagnostics stay on across pages. */
function withDev(to: string, dev: boolean) {
  if (!dev) return to;
  const [path, qs = ''] = to.split('?');
  const p = new URLSearchParams(qs);
  p.set('dev', '1');
  return `${path}?${p}`;
}

export function AppLink({ to, ...rest }: Omit<LinkProps, 'to'> & { to: string }) {
  const [params] = useSearchParams();
  return <Link to={withDev(to, params.get('dev') === '1')} {...rest} />;
}

export function AppNavLink({ to, ...rest }: Omit<NavLinkProps, 'to'> & { to: string }) {
  const [params] = useSearchParams();
  return <NavLink to={withDev(to, params.get('dev') === '1')} {...rest} />;
}
