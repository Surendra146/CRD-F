import assert from 'node:assert/strict';
import test from 'node:test';
import { createManualSubscriptionClient } from '../src/services/manualSubscriptions.js';

test('lost renewal response reuses request ID; successful repeat is a new operation', async () => {
  const calls = [];
  let ids = 0;
  const submit = createManualSubscriptionClient(async (...args) => {
    calls.push(args);
    if (calls.length === 1) throw new Error('response lost');
    return { success: true };
  }, () => `request-${++ids}`);
  const values = { days: 30, reason: 'Approved renewal' };
  await assert.rejects(submit(1, 11, 'renew', values), /response lost/);
  await submit(1, 11, 'renew', values);
  assert.equal(calls[0][3].request_id, calls[1][3].request_id);
  assert.deepEqual(calls[1].slice(0, 3), [1, 11, 'renew']);
  await submit(1, 11, 'renew', values);
  assert.notEqual(calls[1][3].request_id, calls[2][3].request_id);
});

test('changing target or payload after a failure creates a distinct request', async () => {
  const calls = [];
  const submit = createManualSubscriptionClient(async (...args) => {
    calls.push(args); throw new Error('offline');
  }, () => `request-${calls.length}`);
  for (const [tenant, org, days] of [[1, 11, 30], [2, 22, 30], [2, 22, 60]]) {
    await assert.rejects(submit(tenant, org, 'renew', { days, reason: 'Approved' }));
  }
  assert.equal(new Set(calls.map((call) => call[3].request_id)).size, 3);
});
