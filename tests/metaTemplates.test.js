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
  for (const part of [{ type: 'CAROUSEL' }, { type: 'HEADER', format: 'LOCATION' }, { type: 'BUTTONS', buttons: [{ type: 'FLOW' }] }]) {
    const value = template(); value.workflow.approved.components.push(part);
    assert.equal(isSupportedApprovedTemplate(value, '123'), false);
  }
  const authentication = template(); authentication.workflow.approved.category = 'AUTHENTICATION';
  assert.equal(isSupportedApprovedTemplate(authentication, '123'), false);
});

 test('template warnings suppress empty rejection reasons and retain real reasons', async () => {
  const { templateRejectionReason } = await import('../src/utils/metaTemplates.js');
  for (const reason of [null, undefined, '', 'NONE', 'none', ' NONE ']) {
    assert.equal(templateRejectionReason(reason), null);
  }
  assert.equal(templateRejectionReason('Policy violation'), 'Policy violation');
});

test('approved preview preserves all components and substitutes the same recipient mappings', async () => {
  const { templatePreview } = await import('../src/utils/metaTemplates.js');
  const definition = { parameters: { body: [{ field: 'name' }] }, components: [
    { type: 'HEADER', format: 'TEXT', text: 'Hello {{1}}' },
    { type: 'BODY', text: 'Welcome {{1}}' }, { type: 'FOOTER', text: 'Terms apply' },
    { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Visit', url: 'https://example.com/{{1}}' },
      { type: 'PHONE_NUMBER', text: 'Call', phone_number: '+919000000000' }, { type: 'QUICK_REPLY', text: 'Yes' }] },
  ] };
  const before = JSON.stringify(definition);
  const preview = templatePreview(definition, { name: 'Asha', phone: '123' }, { header: ['name'], button_0: ['phone'] });
  assert.equal(preview.header, 'Hello Asha'); assert.equal(preview.body, 'Welcome Asha');
  assert.equal(preview.footer, 'Terms apply');
  assert.deepEqual(preview.buttons.map(b => b.type), ['url', 'phone_number', 'quick_reply']);
  assert.equal(preview.buttons[0].url, 'https://example.com/123');
  assert.equal(JSON.stringify(definition), before);
  assert.equal(templatePreview().body, '');
});

test('named parameters and copy code templates are selectable and preview consistently', async () => {
  const { templatePreview } = await import('../src/utils/metaTemplates.js');
  const value = template();
  value.workflow.approved.components = [{ type: 'BODY', text: 'Hi {{first_name}} there' }, { type: 'BUTTONS', buttons: [{ type: 'COPY_CODE', text: 'Copy code' }] }];
  assert.equal(isSupportedApprovedTemplate(value, '123'), true);
  assert.equal(templatePreview(value.workflow.approved, { name: 'Asha' }, { body: ['name'] }).body, 'Hi Asha there');
});
