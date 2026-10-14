import test from 'node:test';
import assert from 'node:assert/strict';
import { internationalPhone, filterRequests, subscriptionDialog } from '../src/services/onboarding.js';

test('country calling code and national number form a validated international number', () => {
  assert.equal(internationalPhone('+91', '90000 00000'), '919000000000');
  for (const args of [['0', '9000000000'], ['+91', 'invalid'], ['+91', '123'], ['+12345', '9000000000']]) assert.throws(() => internationalPhone(...args));
});
test('subscription errors choose specific dialogs without treating unrelated failures as billing', () => {
  const error = (code) => ({ response: { data: { detail: { code, message: 'Backend explanation' } } } });
  assert.equal(subscriptionDialog(error('SUBSCRIPTION_EXPIRED')).title, 'Active Subscription Required');
  assert.equal(subscriptionDialog(error('WHATSAPP_ENTITLEMENT_REQUIRED')).title, 'WhatsApp Feature Not Included');
  assert.equal(subscriptionDialog(error('PHONE_MISMATCH')), null);
});
test('queue search and independent status filters select the intended organization', () => {
  const rows = [{ business_name:'First', tenant_name:'Tenant A', organization_id:1, status:'requested', subscription_status:'expired' },
    { business_name:'Second', tenant_name:'Tenant B', organization_id:2, status:'accepted', subscription_status:'active' }];
  assert.deepEqual(filterRequests(rows, 'tenant a', 'requested', 'expired'), [rows[0]]);
  assert.deepEqual(filterRequests(rows, 'Second', 'requested', ''), []);
});
