import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessModule, hasRoleAccess } from '../src/utils/rbac.js';
import { resolveDefaultRoute } from '../src/utils/defaultRoute.js';

test('missing identity and empty legacy grants deny access', () => {
  assert.equal(canAccessModule(null, { key: 'customers' }), false);
  assert.equal(canAccessModule({ role: 'member', allowedModules: [] }, { key: 'customers' }), false);
  assert.equal(resolveDefaultRoute({ role: 'member', allowedModules: [] }), '/access-required');
});

test('explicit grants permit only assigned modules', () => {
  const user = { role: 'custom', allowedModules: ['customers', 'reports'] };
  assert.equal(canAccessModule(user, { key: 'customers' }), true);
  assert.equal(canAccessModule(user, { key: 'users' }), false);
  assert.equal(resolveDefaultRoute(user), '/customers/details');
});

test('tenant owner and admin can navigate while platform role has no bypass', () => {
  for (const role of ['owner', 'admin']) {
    assert.equal(canAccessModule({ role }, { key: 'customers' }), true);
    assert.equal(resolveDefaultRoute({ role }), '/dashboard');
  }
  assert.equal(canAccessModule({ role: 'super_admin' }, { key: 'customers' }), false);
});

test('dashboard aliases resolve without redirect loops', () => {
  const user = { role: 'viewer', allowedModules: ['custom-dashboards'] };
  assert.equal(canAccessModule(user, { key: 'dashboard' }), true);
  assert.equal(resolveDefaultRoute(user), '/dashboard');
});

test('role restrictions and reports-only landing route are enforced', () => {
  const user = { role: 'Viewer', allowedModules: ['reports'] };
  assert.equal(hasRoleAccess(user, ['viewer']), true);
  assert.equal(hasRoleAccess(user, ['admin']), false);
  assert.equal(canAccessModule(user, { key: 'reports', roles: ['admin'] }), false);
  assert.equal(resolveDefaultRoute(user), '/reports/recent-upload');
});
