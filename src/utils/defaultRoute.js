import { normalizeAllowedModules } from './moduleAccess';

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
  'custom-dashboards': '/dashboards',
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
  'custom-dashboards',
];

export function resolveDefaultRoute(user) {
  const allowedModules = normalizeAllowedModules(user?.allowedModules);

  if (!allowedModules.length) {
    return '/dashboard';
  }

  const firstMatch = defaultRoutePriority.find((moduleKey) => allowedModules.includes(moduleKey) && moduleRouteByKey[moduleKey]);
  return firstMatch ? moduleRouteByKey[firstMatch] : '/dashboard';
}
