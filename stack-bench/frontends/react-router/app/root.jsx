import { Outlet, Scripts, ScrollRestoration, Meta, Links } from 'react-router';

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>react-router CEO console</title>
        <Meta />
        <Links />
      </head>
      <body style={{ fontFamily: 'system-ui', background: '#111', color: '#eee' }}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <p>loading</p>;
}
