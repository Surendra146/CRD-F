export const consolePermissions = ['tenants.read', 'tenants.manage', 'subscriptions.read', 'subscriptions.manage', 'plans.manage', 'audit.read'];

export function canAccessPlatformPage(permissions = [], page = 'console') {
  return page === 'onboarding'
    ? permissions.includes('onboarding.manage')
    : consolePermissions.some((permission) => permissions.includes(permission));
}
