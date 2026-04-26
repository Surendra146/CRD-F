import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { getEnabledSidebarModules } from '../../config/sidebarModules';
import { useAuthStore } from '../../store/authstore';
import { cn } from '../../utils/cn';
import { canAccessModule } from '../../utils/rbac';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const navigation = getEnabledSidebarModules().filter((item) =>
    canAccessModule(user, item)
  );
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold">HanuRam clc solutions </h1>
        <p className="text-xs text-gray-400 mt-1">Lifecycle Management</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.key}
            to={item.href}
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
        ))}
      </nav>
      
{/* User section */}
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

        <p
          className="mt-0.5 truncate text-xs text-gray-400"
          title={user?.email}
        >
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
