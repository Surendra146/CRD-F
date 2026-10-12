import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { resolveBackendUrl, validateRenderApiOrigin, formatApiError, campaignSchedule } from '../src/config/apiContract.js';

test('API origin supports local, proxy and legacy environment values', () => {
  assert.equal(resolveBackendUrl({}), 'http://localhost:8000');
  assert.equal(resolveBackendUrl({ PROD: true }), '');
  assert.equal(resolveBackendUrl({ VITE_BACKEND_URL: '/' }), '');
  assert.equal(resolveBackendUrl({ VITE_API_URL: 'https://api.example.com/api///' }), 'https://api.example.com');
  assert.equal(resolveBackendUrl({ VITE_BACKEND_URL: ' https://api.example.com/ ' }), 'https://api.example.com');
});

test('Render rejects missing, insecure, local and malformed API origins', () => {
  for (const value of ['', '/', 'http://api.example.com', 'https://localhost', 'https://api.example.com/path', 'https://api.example.com?token=x']) {
    assert.throws(() => validateRenderApiOrigin({ VITE_BACKEND_URL: value }));
  }
  assert.equal(validateRenderApiOrigin({ VITE_BACKEND_URL: 'https://api.example.com/api/' }), 'https://api.example.com');
});

test('FastAPI string, provider and validation errors become readable text', () => {
  assert.equal(formatApiError({ response: { data: { detail: 'No access' } } }), 'No access');
  assert.equal(formatApiError({ response: { data: { detail: { provider_message: 'Reconnect' } } } }), 'Reconnect');
  assert.equal(formatApiError({ response: { data: { detail: [{ loc: ['body', 'phone'], msg: 'Invalid phone' }] } } }), 'phone: Invalid phone');
  assert.equal(formatApiError(new Error('Network Error')), 'Network Error');
});

test('campaign dates use the displayed Kolkata timezone and require a future date and time', () => {
  assert.equal(campaignSchedule('2099-01-01', '10:00').scheduledAt, '2099-01-01T04:30:00.000Z');
  assert.equal(campaignSchedule('', ''), undefined);
  assert.throws(() => campaignSchedule('2099-01-01', ''));
  assert.throws(() => campaignSchedule('2000-01-01', '10:00'));
});

function authStore(authApi) {
  let state;
  const api = { defaults: { headers: { common: {} } } };
  const context = { authApi, api, formatApiError, normalizeRole: (role) => role, persist: (fn) => fn,
    create: (factory) => {
      state = factory((values) => Object.assign(state, values), () => state);
      return state;
    },
  };
  let source = fs.readFileSync(new URL('../src/store/authstore.js', import.meta.url), 'utf8');
  source = source.replace(/^import[^;]+;\s*/gm, '').replace('export const useAuthStore', 'const useAuthStore');
  vm.runInNewContext(source, context);
  return { state, api };
}

test('profile refresh consumes the backend data envelope', async () => {
  const { state } = authStore({ getMe: async () => ({ data: { id: 7, role: 'owner', allowed_modules: ['customers'] } }) });
  await state.refreshUser();
  assert.equal(state.user.id, 7);
  assert.deepEqual(Array.from(state.user.allowedModules), ['customers']);
});

test('temporary profile errors preserve the session', async () => {
  const { state } = authStore({ getMe: async () => { throw { response: { status: 503 } }; } });
  state.user = { id: 7 };
  state.token = 'token';
  await state.refreshUser();
  assert.equal(state.user.id, 7);
  assert.equal(state.token, 'token');
});

test('logout contacts the server before clearing local credentials, including offline failures', async () => {
  for (const offline of [false, true]) {
    let calls = 0;
    const { state, api } = authStore({ logout: async () => { calls++; if (offline) throw new Error('offline'); } });
    state.token = 'token';
    api.defaults.headers.common.Authorization = 'Bearer token';
    await state.logout();
    assert.equal(calls, 1);
    assert.equal(state.token, null);
    assert.equal(state.isAuthenticated, false);
    assert.equal(api.defaults.headers.common.Authorization, undefined);
  }
});
