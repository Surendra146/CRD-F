import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SignOut, SquaresFour, User } from '@phosphor-icons/react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
      <div className="px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SquaresFour size={28} weight="bold" className="text-black" />
            <h1 
              className="text-xl font-black tracking-tighter cursor-pointer"
              onClick={() => navigate('/dashboards')}
              data-testid="navbar-logo"
            >
              CRM Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3" data-testid="user-info">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-none bg-black flex items-center justify-center">
                <User size={20} weight="bold" className="text-white" />
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-black rounded-none transition-all duration-200 hover:bg-black hover:text-white"
              data-testid="logout-button"
            >
              <SignOut size={18} weight="bold" />
              <span className="text-sm font-bold uppercase tracking-[0.1em]">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;