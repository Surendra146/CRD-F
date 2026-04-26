const ROLE_HIERARCHY = ['viewer', 'analyst', 'manager', 'admin', 'owner'];

export function normalizeRole(role) {
  const value = (role || '').toString().trim().toLowerCase();
  return ROLE_HIERARCHY.includes(value) ? value : 'viewer';
}

export function hasRoleAccess(userRole, allowedRoles = []) {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return normalizedAllowedRoles.some(
    (role) => ROLE_HIERARCHY.indexOf(normalizedUserRole) >= ROLE_HIERARCHY.indexOf(role)
  );
}

export function canAccessModule(user, module) {
  const assignedModules = Array.isArray(user?.allowedModules) ? user.allowedModules : [];

  if (assignedModules.length) {
    return assignedModules.includes(module?.key);
  }

  if (!module?.roles?.length) {
    return true;
  }

  return hasRoleAccess(user?.role, module.roles);
}
