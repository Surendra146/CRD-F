import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server, Billing, ManualSubscriptions;
before(async () => {
  try {
  server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null } });
  Billing = (await server.ssrLoadModule('/src/Pages/Billing.jsx')).default;
  ManualSubscriptions = (await server.ssrLoadModule('/src/components/Platform/ManualSubscriptions.jsx')).default;
  } catch (error) { console.error(error); throw error; }
});
after(async () => { await server?.close(); });

function render(component, props = {}, values = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  for (const [key, value] of Object.entries(values)) client.setQueryData([key], value);
  try { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(component, props))); }
  finally { client.clear(); }
}

test('billing shows scheduled access and historical invoices without checkout actions', () => {
  const html = render(Billing, {}, {
    notifications: { data: [] },
    'saas-plans': { data: [{ id: 'local', name: 'Local plan', amount_minor: 12000, currency: 'INR', interval: 'monthly', entitlements: { whatsapp_numbers: 2 } }] },
    'saas-subscription': { data: { status: 'active', effective_status: 'scheduled', current_start: '2030-10-10T00:00:00Z', current_end: '2030-11-10T00:00:00Z' } },
    'saas-invoices': { data: [{ id: 'history', invoice_reference: 'Historical invoice', amount_minor: 12000, currency: 'INR', status: 'paid', created_at: '2026-10-10T00:00:00Z' }] },
    'saas-usage': { data: [], billing_note: 'Messaging usage is separate.' },
  });
  assert.match(html, /Status: scheduled/);
  assert.match(html, /Historical invoice/);
  assert.match(html, /Subscription expires/);
  assert.match(html, /staff manage plan assignment/);
  assert.doesNotMatch(html, /Select &amp; pay|Cancel renewal|Refresh payment status/);
});

test('subscription readers cannot see staff mutation controls', () => {
  const html = render(ManualSubscriptions, { permissions: ['subscriptions.read'] }, {
    'platform-organizations': { data: [] }, 'platform-subscriptions': { data: [] }, 'platform-subscription-plans': { data: [] },
  });
  assert.match(html, /Manual subscriptions/);
  assert.doesNotMatch(html, /Apply subscription change|Immediately \(revoke access\)/);
  assert.equal(render(ManualSubscriptions, { permissions: [] }), '');
});

test('authorized staff get assignment, renewal and cancellation controls', () => {
  const html = render(ManualSubscriptions, { permissions: ['subscriptions.read', 'subscriptions.manage'] }, {
    'platform-organizations': { data: [{ id: 11, tenant_id: 1, name: 'First business' }] },
    'platform-subscriptions': { data: [] },
    'platform-subscription-plans': { data: [{ id: 'local', name: 'Local plan', is_active: true }, { id: 'retired', name: 'Retired plan', is_active: false }] },
  });
  assert.match(html, /Assign or replace plan/);
  assert.match(html, /Renew current plan/);
  assert.match(html, /Cancel subscription/);
  assert.match(html, /Reason for subscription change/);
  assert.match(html, /Apply subscription change/);
  assert.match(html, /Local plan/);
  assert.doesNotMatch(html, /Retired plan/);
});
