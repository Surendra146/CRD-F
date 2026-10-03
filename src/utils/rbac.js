import { moduleAccessKey, normalizeAllowedModules } from './moduleAccess';

export function normalizeRole(role) {
  return (role || '').toString().trim();
}

export function hasRoleAccess() {
  return true;
}

export function canAccessModule(user, module) {
  const normalizedRole = (user?.role || '').toString().trim().toLowerCase();
  if (normalizedRole === 'owner' || normalizedRole === 'admin') {
    return true;
  }

  const assignedModules = normalizeAllowedModules(user?.allowedModules);
  const accessKey = moduleAccessKey(module);

  if (assignedModules.length) {
    return assignedModules.includes(accessKey);
  }

  if (!module?.roles?.length) {
    return true;
  }

  return true;
}
