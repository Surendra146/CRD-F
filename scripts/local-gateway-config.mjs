export const LOCAL_BROWSER_ORIGIN = 'http://127.0.0.1:5174';
export const LOCAL_GATEWAY_TARGET = 'http://127.0.0.1:8002';

export function localGatewayOptions(command, mode) {
  if (mode !== 'dev-access-local') return {};
  if (command !== 'serve') throw new Error('dev-access-local is only available for the local development server');
  const proxy = {};
  for (const prefix of ['/api', '/dev-access', '/health', '/socket.io']) {
    proxy[prefix] = {
      target: LOCAL_GATEWAY_TARGET,
      changeOrigin: true,
      ws: false,
      configure(instance) {
        instance.on('proxyReq', (outgoing, incoming) => {
          // Same-origin browser GETs often omit Origin. Never rewrite a supplied Origin.
          if (!incoming.headers.origin) outgoing.setHeader('Origin', LOCAL_BROWSER_ORIGIN);
        });
      },
    };
  }
  return {
    define: {
      'import.meta.env.VITE_DEV_ACCESS_ENABLED': JSON.stringify('true'),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify('/'),
      'import.meta.env.VITE_API_URL': JSON.stringify('/'),
      'import.meta.env.VITE_ENABLE_SOCKET_PROGRESS': JSON.stringify('false'),
    },
    server: { host: '127.0.0.1', port: 5174, strictPort: true, allowedHosts: ['127.0.0.1'], proxy },
    plugins: [{
      name: 'local-gateway-origin-guard',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.headers.host !== '127.0.0.1:5174' ||
              (request.headers.origin && request.headers.origin !== LOCAL_BROWSER_ORIGIN) ||
              ['cross-site', 'same-site'].includes(request.headers['sec-fetch-site'])) {
            response.writeHead(403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
            response.end('Local browser origin not allowed');
            return;
          }
          next();
        });
      },
    }],
  };
}
