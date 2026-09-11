import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Local dev proxies /api to chat-api (uvicorn on :8787); production serves the same path via the deploy's reverse proxy or public/chat-config.json. */
const CHAT_API = process.env.CHAT_API_URL ?? 'http://127.0.0.1:8787';

const DAY = 24 * 60 * 60;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Skin Ledger — skincare & hair care, ranked on evidence',
        short_name: 'Skin Ledger',
        description: 'Skincare, body and hair-care listings from Flipkart and Amazon.in ranked on the verified ingredient list — plus routines, a routine builder and an assistant that reads the same data.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f4f2',
        theme_color: '#0f6e64',
        lang: 'en-IN',
        categories: ['health', 'shopping', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          { name: 'My routine', url: '/#/routine', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Product rankings', url: '/#/products', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // App shell only: the 372 MB of generated data under /data is cached as it is visited (below), never precached.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['data/**', 'og.*', 'icons/icon.html'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/data\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Data files are versioned by generatedAt inside the manifest: prefer the network so a regenerate is picked up
            // straight away, fall back to what was seen before when offline or slow.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && (url.pathname.startsWith('/data/') || url.pathname === '/chat-config.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ledger-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 160, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ledger-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { proxy: { '/api': { target: CHAT_API, changeOrigin: true } } },
  preview: { proxy: { '/api': { target: CHAT_API, changeOrigin: true } } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['gsap', '@gsap/react', 'framer-motion'],
        },
      },
    },
  },
});
