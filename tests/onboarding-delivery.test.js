import test from 'node:test';
import assert from 'node:assert/strict';
import { testDelivery, deliveryPolling } from '../src/services/onboarding.js';

for (const status of ['accepted', 'sent', 'delivered', 'read', 'failed']) {
  test(`delivery status ${status} controls connection`, () => {
    const result = testDelivery({ test_result: status });
    assert.equal(result.status, status);
    assert.equal(result.connected, ['delivered', 'read'].includes(status));
    assert.ok(result.message.length);
  });
}
test('missing status stays pending without an invented failure', () => {
  assert.equal(testDelivery().status, 'pending');
  assert.equal(testDelivery().connected, false);
  assert.match(testDelivery().message, /No delivery confirmation/);
});
test('polling stops on terminal status and after thirty minutes', () => {
  const now = Date.now();
  const row = (status, age = 0) => ({status: 'setup_in_progress', verification: {
    test_result: status, checked_at: new Date(now - age).toISOString() }});
  assert.equal(deliveryPolling([row('accepted')], now), 10000);
  assert.equal(deliveryPolling([row('sent')], now), 10000);
  for (const state of ['delivered', 'read', 'failed']) assert.equal(deliveryPolling([row(state)], now), false);
  assert.equal(deliveryPolling([row('accepted', 1800000)], now), false);
  assert.equal(deliveryPolling([], now), false);
});
