import assert from 'node:assert/strict';
import test from 'node:test';
import { isSupportedApprovedTemplate } from '../src/utils/metaTemplates.js';

const template = () => ({ isActive: true, stats: { meta_status: 'APPROVED' }, workflow: { approved: {
  waba_id: '123', category: 'UTILITY', components: [{ type: 'HEADER', format: 'IMAGE' }, { type: 'BODY', text: 'Hi {{1}} there' }],
} } });

test('bulk choices require an approved compatible WABA', () => {
  assert.equal(isSupportedApprovedTemplate(template(), '123'), true);
  assert.equal(isSupportedApprovedTemplate(template(), '456'), false);
  for (const status of ['PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'DELETED']) {
    const value = template(); value.stats.meta_status = status;
    assert.equal(isSupportedApprovedTemplate(value, '123'), false);
  }
});

test('bulk choices exclude formats the sender cannot implement', () => {
  for (const part of [{ type: 'CAROUSEL' }, { type: 'HEADER', format: 'LOCATION' }, { type: 'BODY', text: 'Hi {{name}} there' }, { type: 'BUTTONS', buttons: [{ type: 'FLOW' }] }]) {
    const value = template(); value.workflow.approved.components.push(part);
    assert.equal(isSupportedApprovedTemplate(value, '123'), false);
  }
  const authentication = template(); authentication.workflow.approved.category = 'AUTHENTICATION';
  assert.equal(isSupportedApprovedTemplate(authentication, '123'), false);
});
