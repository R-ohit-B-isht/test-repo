import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/** Local dev proxies /api to chat-api (uvicorn on :8787); production serves the same path via the deploy's reverse proxy or public/chat-config.json. */
const CHAT_API = process.env.CHAT_API_URL ?? 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
