import { normalizeAllowedModules } from './moduleAccess.js';
import { normalizeRole } from './rbac.js';

const moduleRouteByKey = {
  dashboard: '/dashboard',
  customers: '/customers/details',
  'customer-details': '/customers/details',
  'customer-sales': '/customers/sales',
  analytics: '/analytics',
  import: '/import',
  campaigns: '/campaigns',
  'campaign-master': '/campaigns',
  'campaigns-child': '/campaigns',
  'segments-child': '/segments',
  whatsapp: '/whatsapp',
  'whatsapp-child': '/whatsapp',
  templates: '/templates',
  'templates-child': '/templates',
  roles: '/roles',
  users: '/users',
  settings: '/settings',
  reports: '/reports/recent-upload',
  'custom-dashboards': '/dashboard',
};

const defaultRoutePriority = [
  'dashboard',
  'customers',
  'analytics',
  'import',
  'campaigns',
  'templates',
  'whatsapp',
  'segments-child',
  'roles',
  'users',
  'settings',
  'reports',
  'custom-dashboards',
];

export function resolveDefaultRoute(user) {
  if (!user) return '/login';
  if (['owner', 'admin'].includes(normalizeRole(user.role))) return '/dashboard';
  const allowedModules = normalizeAllowedModules(user?.allowedModules);

  if (!allowedModules.length) {
    return '/access-required';
  }

  const firstMatch = defaultRoutePriority.find((moduleKey) => allowedModules.includes(moduleKey) && moduleRouteByKey[moduleKey]);
  return firstMatch ? moduleRouteByKey[firstMatch] : '/access-required';
}
