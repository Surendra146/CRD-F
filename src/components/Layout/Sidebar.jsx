import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';

import { getEnabledSidebarModules } from '../../config/sidebarModules';
import { useAuthStore } from '../../store/authstore';
import { cn } from '../../utils/cn';
import { canAccessModule } from '../../utils/rbac';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'sidebar-expanded-parents-v1';

export default function Sidebar({ mobile = false, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [expandedParentKey, setExpandedParentKey] = useState(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return '';
    }
  });

  const navigation = useMemo(() => {
    return getEnabledSidebarModules()
      .map((item) => ({
        ...item,
        children: Array.isArray(item.children)
          ? item.children.filter(
              (child) => child.enabled !== false && canAccessModule(user, child)
            )
          : undefined,
      }))
      .filter((item) => {
        const hasVisibleChildren = Array.isArray(item.children) && item.children.length > 0;
        return canAccessModule(user, item) || hasVisibleChildren;
      });
  }, [user]);

  const parentKeys = useMemo(() => {
    return navigation
      .filter((item) => Array.isArray(item.children) && item.children.length > 0)
      .map((item) => item.key);
  }, [navigation]);

  const activeParentKey = useMemo(() => {
    const activeParent = navigation.find(
      (item) =>
        Array.isArray(item.children) &&
        item.children.some((child) => location.pathname.startsWith(child.href))
    );

    return activeParent?.key || '';
  }, [navigation, location.pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Expand the parent selected by browser navigation and updated module access.
    setExpandedParentKey((prev) => {
      if (activeParentKey) return activeParentKey;
      if (prev && parentKeys.includes(prev)) return prev;
      return '';
    });
  }, [parentKeys, activeParentKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_EXPANDED_STORAGE_KEY,
        JSON.stringify(expandedParentKey)
      );
    } catch {
      // Ignore storage errors
    }
  }, [expandedParentKey]);

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn("flex flex-col bg-gray-900 text-white", mobile ? "h-dvh w-full" : "fixed left-0 top-0 z-30 hidden h-dvh w-64 lg:flex")}>
      <div className="px-6 py-5 pr-12 border-b border-gray-800">
        <h1 className="text-xl font-bold">HanuRam Tech</h1>
        <p className="text-xs text-gray-400 mt-1">Lifecycle Management</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;

          const isParentActive = hasChildren
            ? item.children.some((child) => location.pathname.startsWith(child.href))
            : location.pathname.startsWith(item.href);

          if (!hasChildren) {
            return (
              <NavLink
                key={item.key}
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          }

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setExpandedParentKey((prev) => (prev === item.key ? '' : item.key))
                }
                className={cn(
                  'flex w-full items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isParentActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </span>

                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedParentKey === item.key ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {expandedParentKey === item.key ? (
                <div className="ml-4 space-y-1 border-l border-gray-800 pl-3">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.key}
                      to={child.href}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        )
                      }
                    >
                      <child.icon className="w-4 h-4 mr-2" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800 bg-gray-950/40">
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 px-3 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <span className="text-sm font-semibold uppercase">
                {user?.organization?.name?.slice(0, 2) || 'OR'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="truncate whitespace-nowrap text-sm font-semibold text-white"
                title={user?.organization?.name}
              >
                {user?.organization?.name || 'Organization'}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-400" title={user?.email}>
                {user?.email || 'No email found'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
