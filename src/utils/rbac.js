import { moduleAccessKey, normalizeAllowedModules } from './moduleAccess.js';

export function normalizeRole(role) {
  return (role || '').toString().trim().toLowerCase().replace(/[ -]+/g, '_');
}

export function hasRoleAccess(user, roles = []) {
  if (!user) return false;
  return roles.length === 0 || roles.map(normalizeRole).includes(normalizeRole(user.role));
}

export function canAccessModule(user, module) {
  if (!user) return false;
  const normalizedRole = normalizeRole(user.role);
  const assignedModules = normalizeAllowedModules(user?.allowedModules);
  const accessKey = moduleAccessKey(module);
  if (accessKey === 'platform') return Boolean(user.platformPermissions?.length);
  if (!hasRoleAccess(user, module?.roles || [])) return false;
  // Ownership/administration is tenant scoped. Platform staff has no implicit tenant access.
  if (normalizedRole === 'owner' || normalizedRole === 'admin') return Boolean(accessKey);
  return Boolean(accessKey) && hasRoleAccess(user, module?.roles || []) && assignedModules.includes(accessKey);
}
