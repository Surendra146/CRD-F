import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authstore';
import { hasRoleAccess } from '../utils/rbac';
import { resolveDefaultRoute } from '../utils/defaultRoute';
import { normalizeAllowedModules } from '../utils/moduleAccess';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const allowedModules = normalizeAllowedModules(user?.allowedModules);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (window.location.pathname === '/dashboard' && allowedModules.length && !allowedModules.includes('dashboard')) {
    return <Navigate to={resolveDefaultRoute(user)} replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={resolveDefaultRoute(user)} replace />;
  }

  return children;
}

export function RoleRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !hasRoleAccess(user?.role, allowedRoles)) {
    return <Navigate to={resolveDefaultRoute(user)} replace />;
  }

  return children;
}

export function ModuleRoute({ children, moduleKey }) {
  const { isAuthenticated, user } = useAuthStore();
  const allowedModules = normalizeAllowedModules(user?.allowedModules);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    moduleKey &&
    allowedModules.length &&
    !allowedModules.includes(moduleKey)
  ) {
    return <Navigate to={resolveDefaultRoute(user)} replace />;
  }

  return children;
}
