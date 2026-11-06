import test from 'node:test';
import assert from 'node:assert/strict';
import { canResetWhatsApp, resetPayload, activeStatuses } from '../src/services/onboarding.js';

for (const status of ['requested', 'accepted', 'setup_in_progress', 'action_required', 'failed', 'connected']) {
  test(`only explicit super-admin reset permission allows ${status}`, () => {
    assert.equal(canResetWhatsApp(['onboarding.reset'], { status }), true);
    for (const permissions of [[], ['onboarding.manage'], ['tenants.manage']])
      assert.equal(canResetWhatsApp(permissions, { status }), false);
  });
}
test('reset records permit a fresh onboarding request and cannot be reset again in the UI', () => {
  assert.equal(activeStatuses.has('reset'), false);
  assert.equal(canResetWhatsApp(['onboarding.reset'], { status:'reset' }), false);
  assert.equal(canResetWhatsApp(['onboarding.reset'], null), false);
});
test('confirmation requires a reason and sends no tenant or organization authority', () => {
  for (const value of ['', '  ', null, 'x'.repeat(501)]) assert.throws(() => resetPayload(value));
  assert.deepEqual(resetPayload(' Customer wants a new number '), { reason:'Customer wants a new number' });
});
