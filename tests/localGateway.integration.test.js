import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { localGatewayOptions } from '../scripts/local-gateway-config.mjs';

test('real Vite proxy and gateway preserve the independent access boundary', {
  skip: !process.env.HANURAM_GATEWAY_TEST_PYTHON,
  timeout: 120000,
}, async () => {
  const fixture = process.env.HANURAM_GATEWAY_TEST_FIXTURE;
  assert.ok(fixture, 'Set HANURAM_GATEWAY_TEST_FIXTURE to proxy_test_fixture.py');
  const child = spawn(process.env.HANURAM_GATEWAY_TEST_PYTHON, ['-B', fixture], {
    env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let server;
  let session;
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const fetchBefore = globalThis.fetch;
  const locationBefore = globalThis.location;
  try {
    const lines = createInterface({ input: child.stdout });
    const ready = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', () => reject(new Error('Gateway fixture exited: ' + stderr)));
      lines.once('line', (line) => { try { resolve(JSON.parse(line)); } catch (error) { reject(error); } });
    });
    const options = localGatewayOptions('serve', 'dev-access-local');
    for (const proxy of Object.values(options.server.proxy)) proxy.target = `http://127.0.0.1:${ready.port}`;
    server = await createServer({
      ...options,
      root: fileURLToPath(new URL('..', import.meta.url)),
      configFile: false,
      plugins: [react(), ...options.plugins],
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { ...options.server, port: 0, hmr: false, watch: null },
    });
    await server.listen();
    const port = server.httpServer.address().port;
    async function request(path, { method = 'GET', headers = {}, body } = {}) {
      return new Promise((resolve, reject) => {
        const data = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
        const outgoing = http.request({
          hostname: '127.0.0.1', port, path, method,
          headers: { Host: '127.0.0.1:5174', ...(data === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }), ...headers },
        }, (incoming) => {
          const chunks = [];
          incoming.on('data', (chunk) => chunks.push(chunk));
          incoming.on('end', () => resolve({ status: incoming.statusCode, body: Buffer.concat(chunks).toString() }));
        });
        outgoing.on('error', reject);
        outgoing.end(data);
      });
    }
    const firstPage = await request('/login');
    assert.equal(firstPage.status, 200);
    assert.match(firstPage.body, /src\/main.jsx/);
    assert.equal((await request('/dev-access/session')).status, 401);
    assert.equal((await request('/dev-access/login', { method: 'POST', body: { password: 'incorrect-password' } })).status, 401);
    for (const headers of [{ Origin: 'https://evil.test' }, { Host: 'evil.test:5174' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      assert.equal((await request('/dev-access/session', { headers })).status, 403);
    }
    globalThis.location = { origin: 'http://127.0.0.1:5174' };
    globalThis.fetch = async (url, options) => {
      const response = await request(new URL(url).pathname, options);
      return { ok: response.status >= 200 && response.status < 300, json: async () => JSON.parse(response.body) };
    };
    session = await server.ssrLoadModule('/src/services/devAccess.js');
    assert.equal(session.devAccessEnabled, true);
    const Gate = (await server.ssrLoadModule('/src/components/DevAccessGate.jsx')).default;
    const Login = (await server.ssrLoadModule('/src/Pages/Login.jsx')).default;
    function render() {
      return renderToString(React.createElement(Gate, null, React.createElement(MemoryRouter, null, React.createElement(Login))));
    }
    const locked = render();
    assert.match(locked, /Development access/);
    assert.doesNotMatch(locked, /Welcome back\.|Email address/);
    await session.loginDevAccess('', 'local-proxy-fixture-password');
    const token = session.getDevToken();
    const api = (await server.ssrLoadModule('/src/config/apiConfig.js')).default;
    await assert.rejects(api.get('/api/auth/me', { baseURL: 'https://evil.test' }), /Development request origin blocked/);
    await assert.rejects(api.get('https://evil.test/api/auth/me'), /Development request origin blocked/);
    const unlocked = render();
    assert.match(unlocked, /Welcome back\./);
    assert.match(unlocked, /Lock development access/);
    const headers = { 'X-Dev-Access-Token': token };
    assert.equal((await request('/dev-access/session', { headers })).status, 200);
    assert.equal((await request('/api/analytics/dashboard', { headers: { ...headers, Authorization: 'Bearer invalid' } })).status, 401);
    assert.equal((await request('/api/analytics/dashboard', { headers: { ...headers, Authorization: 'Bearer fixture-valid' } })).status, 200);
    assert.equal((await request('/api/auth/login', { method: 'POST', headers: { ...headers, Authorization: 'Bearer fixture-valid' }, body: { email: 'fixture@example.test', password: 'fixture-password' } })).status, 200);
    for (const path of ['/api/auth/register', '/api/admin', '/api/communications/whatsapp/send', '/health', '/socket.io']) {
      assert.equal((await request(path, { headers })).status, 403);
    }
    for (const method of ['DELETE', 'PATCH', 'PUT']) {
      assert.equal((await request('/api/analytics/dashboard', { method, headers })).status, 403);
    }
    await session.logoutDevAccess('');
    assert.equal((await request('/dev-access/session', { headers })).status, 401);
    assert.equal(session.getDevToken(), null);
    assert.match(render(), /Development access/);
    assert.doesNotMatch(render(), /Welcome back\./);
  } finally {
    session?.clearDevAccess();
    globalThis.fetch = fetchBefore;
    globalThis.location = locationBefore;
    await server?.close();
    child.stdin.end();
    if (child.exitCode === null) await new Promise((resolve) => child.once('exit', resolve));
  }
});
