import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'public-privacy-policy',
    configureServer(server) {
      server.middlewares.use(servePrivacyPolicy);
    },
    configurePreviewServer(server) {
      server.middlewares.use(servePrivacyPolicy);
    },
  }],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: process.env.DOCKER_WATCH_POLLING === 'true',
    },
    proxy: {
      '/api': {
        target: process.env.DOCKER_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.DOCKER_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
      '/health': {
        target: process.env.DOCKER_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['tslib']
  }
})

function servePrivacyPolicy(req, _res, next) {
  const pathname = req.url?.split('?')[0];
  if (pathname === '/privacy-policy' || pathname === '/privacy-policy/') {
    req.url = '/privacy-policy/index.html';
  }
  next();
}
