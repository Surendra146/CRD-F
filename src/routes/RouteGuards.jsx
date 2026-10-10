import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authstore';
import { resolveDefaultRoute } from '../utils/defaultRoute';
import { canAccessModule, hasRoleAccess } from '../utils/rbac';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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

export function RoleRoute({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return hasRoleAccess(user, roles) ? children : <Navigate to="/access-required" replace />;
}

export function ModuleRoute({ children, moduleKey }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessModule(user, { key: moduleKey })) {
    return <Navigate to={resolveDefaultRoute(user)} replace />;
  }

  return children;
}
