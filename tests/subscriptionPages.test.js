import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let Platform, Sidebar, authStore;
let server, Billing, ManualSubscriptions, WhatsAppSetupAssistance, WhatsAppOnboardingQueue;
before(async () => {
  try {
  server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null } });
  Platform = (await server.ssrLoadModule('/src/Pages/Platform.jsx')).default;
  Sidebar = (await server.ssrLoadModule('/src/components/Layout/Sidebar.jsx')).default;
  authStore = (await server.ssrLoadModule('/src/store/authstore.js')).useAuthStore;
  Billing = (await server.ssrLoadModule('/src/Pages/Billing.jsx')).default;
  ManualSubscriptions = (await server.ssrLoadModule('/src/components/Platform/ManualSubscriptions.jsx')).default;
  WhatsAppSetupAssistance = (await server.ssrLoadModule('/src/components/whatsapp/WhatsAppSetupAssistance.jsx')).default;
  WhatsAppOnboardingQueue = (await server.ssrLoadModule('/src/components/Platform/WhatsAppOnboardingQueue.jsx')).default;
  } catch (error) { console.error(error); throw error; }
});

test('tenant setup uses assistance requests and prevents a duplicate active request', () => {
  const empty = render(WhatsAppSetupAssistance, {}, { 'business-onboarding': { data: [] }, 'saas-subscription': { data: null } });
  assert.match(empty, /Request Setup Assistance/);
  assert.match(empty, /Country code/);
  assert.doesNotMatch(empty, /Connect WhatsApp/);
  const pending = render(WhatsAppSetupAssistance, {}, {
    'business-onboarding': { data: [{ id:'request', business_name:'Business', phone:'919000000000', status:'requested', created_at:'2026-10-14T08:00:00Z' }] },
    'saas-subscription': { data: null },
  });
  assert.match(pending, /Requested/);
  assert.doesNotMatch(pending, /Request Setup Assistance<\/button>/);
  assert.match(pending, /WhatsApp setup progress/);
});

test('admin queue exposes review actions and filters without a status bypass selector', () => {
  const html = render(WhatsAppOnboardingQueue, { onViewSubscription: () => {} }, {
    'platform-onboarding': { data: [{ id:'request', tenant_name:'Example Tenant', organization_id:12, business_name:'Business', phone:'919000000000', status:'requested', subscription_status:'expired', created_at:'2026-10-14T08:00:00Z' }] },
  });
  assert.match(html, /Example Tenant/);
  assert.match(html, /Accept Request/);
  assert.match(html, /Reject Request/);
  assert.match(html, /View Subscription/);
  assert.match(html, /Subscription status/);
  assert.doesNotMatch(html, /Next status/);
});
after(async () => { await server?.close(); });

function render(component, props = {}, values = {}, route = '/platform') {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } } });
  for (const [key, value] of Object.entries(values)) client.setQueryData([key], value);
  try { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(component, props)))); }
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


test('Subscription shows only permitted children and stays expanded on direct onboarding access', () => {
  // SSR must read the test identity rather than Zustand's initial persisted snapshot.

  Object.assign(authStore.getInitialState(), { user: { role: 'member', platformPermissions: ['onboarding.manage'] } });
  const onboarding = render(Sidebar, {}, {}, '/platform/onboarding');
  assert.match(onboarding, /Subscription/);
  assert.match(onboarding, /aria-expanded="true"/);
  assert.match(onboarding, /aria-current="page"[^>]*href="\/platform\/onboarding"/);
  assert.doesNotMatch(onboarding, /Platform Console/);

  Object.assign(authStore.getInitialState(), { user: { role: 'member', platformPermissions: ['subscriptions.read', 'onboarding.manage'] } });
  const both = render(Sidebar, {}, {}, '/platform/onboarding');
  assert.match(both, /Platform Console/);
  assert.match(both, /WhatsApp Onboarding/);
  assert.equal((both.match(/aria-current="page"/g) || []).length, 1);

  const console = render(Sidebar, {}, {}, '/platform?organization=12');
  assert.match(console, /aria-expanded="true"/);
  assert.match(console, /aria-current="page"[^>]*href="\/platform"/);
  Object.assign(authStore.getInitialState(), { user: { role: 'owner', platformPermissions: [] } });
  const tenant = render(Sidebar);
  assert.doesNotMatch(tenant, /Platform Console|WhatsApp Onboarding|sidebar-subscription/);
  assert.match(tenant, /href="\/billing"/);
});

test('direct staff pages enforce separate permissions and render the queue only on its route', () => {
  const values = {
    notifications: { data: [] },
    'platform-access': { data: { is_staff: true, permissions: ['subscriptions.read', 'onboarding.manage'] } },
    'platform-onboarding': { data: [] },
    'platform-organizations': { data: [] }, 'platform-subscriptions': { data: [] }, 'platform-subscription-plans': { data: [] },
  };
  const console = render(Platform, {}, values);
  assert.match(console, /Manual subscriptions/);
  assert.doesNotMatch(console, /WhatsApp Onboarding Queue/);
  const onboarding = render(Platform, { page: 'onboarding' }, values, '/platform/onboarding');
  assert.match(onboarding, /WhatsApp Onboarding Queue/);
  assert.doesNotMatch(onboarding, /Manual subscriptions/);
  values['platform-access'].data.permissions = ['subscriptions.read'];
  assert.match(render(Platform, { page: 'onboarding' }, values), /do not have permission/);
  values['platform-access'].data = { is_staff: false, permissions: ['onboarding.manage'] };
  assert.match(render(Platform, { page: 'onboarding' }, values), /authorized HanuRam Tech staff account/);
});

test('onboarding-only staff cannot see subscription links or controls', () => {
  const html = render(WhatsAppOnboardingQueue, {}, {
    'platform-onboarding': { data: [{ id: 'request', business_name: 'Example', organization_id: 12, phone: '919000000000', status: 'requested', subscription_status: 'expired', created_at: '2026-10-14T08:00:00Z' }] },
  });
  assert.match(html, /View onboarding details for Example/);
  assert.match(html, /Accept Request/);
  assert.doesNotMatch(html, /View Subscription/);
});
