import test from 'node:test';
import assert from 'node:assert/strict';
import { localGatewayOptions, LOCAL_BROWSER_ORIGIN, LOCAL_GATEWAY_TARGET } from '../scripts/local-gateway-config.mjs';
import { readFile } from 'node:fs/promises';

test('local mode uses only loopback gateway, with no production config changes', () => {
  assert.deepEqual(localGatewayOptions('serve', 'development'), {});
  assert.deepEqual(localGatewayOptions('build', 'production'), {});
  assert.throws(() => localGatewayOptions('build', 'dev-access-local'));
  const config = localGatewayOptions('serve', 'dev-access-local');
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 5174);
  assert.equal(config.define['import.meta.env.VITE_DEV_ACCESS_ENABLED'], '"true"');
  assert.equal(config.define['import.meta.env.VITE_BACKEND_URL'], '"/"');
  for (const route of ['/api', '/dev-access', '/health', '/socket.io']) {
    const proxy = config.server.proxy[route];
    assert.equal(proxy.target, LOCAL_GATEWAY_TARGET);
    assert.equal(proxy.ws, false);
    let callback;
    proxy.configure({ on: (event, listener) => { assert.equal(event, 'proxyReq'); callback = listener; } });
    let forwarded;
    callback({ setHeader: (name, value) => { forwarded = [name, value]; } }, { headers: {} });
    assert.deepEqual(forwarded, ['Origin', LOCAL_BROWSER_ORIGIN]);
    forwarded = null;
    callback({ setHeader: () => { forwarded = true; } }, { headers: { origin: 'https://evil.test' } });
    assert.equal(forwarded, null);
  }
});

test('local Vite guard rejects foreign origins, hosts and cross-site browser requests', () => {
  let guard;
  const plugin = localGatewayOptions('serve', 'dev-access-local').plugins[0];
  plugin.configureServer({ middlewares: { use: (middleware) => { guard = middleware; } } });
  for (const headers of [
    { host: 'evil.test:5174' },
    { host: '127.0.0.1:5174', origin: 'http://localhost:5174' },
    { host: '127.0.0.1:5174', 'sec-fetch-site': 'cross-site' },
    { host: '127.0.0.1:5174', 'sec-fetch-site': 'same-site' },
  ]) {
    let status;
    guard({ headers }, { writeHead: (value) => { status = value; }, end() {} }, () => assert.fail('Forbidden request passed'));
    assert.equal(status, 403);
  }
  for (const headers of [{ host: '127.0.0.1:5174' }, { host: '127.0.0.1:5174', origin: LOCAL_BROWSER_ORIGIN, 'sec-fetch-site': 'same-origin' }]) {
    let passed = false;
    guard({ headers }, {}, () => { passed = true; });
    assert.equal(passed, true);
  }
});

test('development access supports same-origin relative URLs and wrong password rejection', async () => {
  const source = await readFile(new URL('../src/services/devAccess.js', import.meta.url), 'utf8');
  const access = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.equal(access.resolveDevAccessBase('', LOCAL_BROWSER_ORIGIN), LOCAL_BROWSER_ORIGIN + '/');
  assert.equal(access.resolveDevAccessBase('/', LOCAL_BROWSER_ORIGIN), LOCAL_BROWSER_ORIGIN + '/');
  assert.equal(access.resolveDevAccessBase('https://gateway.test', LOCAL_BROWSER_ORIGIN), 'https://gateway.test/');
  const fetchBefore = globalThis.fetch;
  const locationBefore = globalThis.location;
  globalThis.location = { origin: LOCAL_BROWSER_ORIGIN };
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, LOCAL_BROWSER_ORIGIN + '/dev-access/login');
    assert.equal(options.credentials, 'omit');
    return { ok: false, json: async () => ({ detail: 'Invalid development password' }) };
  };
  try {
    await assert.rejects(access.loginDevAccess('', 'wrong-password'), /Invalid development password/);
    assert.equal(access.getDevToken(), null);
  } finally { globalThis.fetch = fetchBefore; globalThis.location = locationBefore; }
});
