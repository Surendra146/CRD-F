import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authstore';
import { hasRoleAccess } from '../utils/rbac';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RoleRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !hasRoleAccess(user?.role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function ModuleRoute({ children, moduleKey }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    moduleKey &&
    Array.isArray(user?.allowedModules) &&
    user.allowedModules.length &&
    !user.allowedModules.includes(moduleKey)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
