import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('development session stays volatile, expires, and revokes', async () => {
  const source = await readFile(new URL('../src/services/devAccess.js', import.meta.url), 'utf8');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const access = await import(moduleUrl);
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  let expire;
  let request;
  globalThis.setTimeout = (callback, delay) => { assert.equal(delay, 900000); expire = callback; return 1; };
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ token: 'A'.repeat(43), expires_in: 900 }) };
  };
  try {
    assert.equal(access.getDevToken(), null);
    await access.loginDevAccess('https://gateway.test', 'test-password');
    assert.equal(access.getDevToken(), 'A'.repeat(43));
    assert.equal(request.url.pathname, '/dev-access/login');
    assert.equal(request.options.credentials, 'omit');
    expire();
    assert.equal(access.getDevToken(), null);
    await access.loginDevAccess('https://gateway.test', 'test-password');
    await access.logoutDevAccess('https://gateway.test');
    assert.equal(access.getDevToken(), null);
    assert.equal(request.options.headers['X-Dev-Access-Token'], 'A'.repeat(43));
    assert.equal(request.url.pathname, '/dev-access/logout');
    assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
    const fresh = await import(moduleUrl + '#refresh');
    assert.equal(fresh.getDevToken(), null);
  } finally { globalThis.fetch = originalFetch; globalThis.setTimeout = originalSetTimeout; }
});
