import { createHandler, StartServer } from '@solidjs/start/server';
export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html>
        <head><title>solidstart</title>{assets}</head>
        <body><div id="app">{children}</div>{scripts}</body>
      </html>
    )}
  />
));
