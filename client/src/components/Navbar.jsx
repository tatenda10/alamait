import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaCog, 
  FaUserGraduate, 
  FaCalculator, 
  FaChartBar,
  FaSignOutAlt,
  FaUser,
  FaChartLine
} from 'react-icons/fa';

const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FaChartLine,
      path: '/dashboard',
      exact: true
    },
    {
      id: 'students',
      label: 'Students',
      icon: FaUserGraduate,
      path: '/dashboard/students'
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: FaCalculator,
      path: '/dashboard/chart-of-accounts'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FaChartBar,
      path: '/dashboard/reports/income-statement'
    },
    {
      id: 'configuration',
      label: 'Configuration',
      icon: FaCog,
      path: '/dashboard/boarding-houses'
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md flex items-center px-6 justify-between z-30">
      {/* Logo */}
      <div className="flex items-center">
        <span className="text-xl font-extrabold tracking-tight text-gray-900">Alamait</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex items-center space-x-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `flex items-center px-4 py-2 transition-all duration-200 font-medium text-sm relative ${
                isActive 
                  ? 'text-[#f58020] border-b-2 border-[#f58020]' 
                  : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <div className="w-8 h-8 bg-[#f58020] rounded-full flex items-center justify-center">
              <FaUser className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">Admin</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar; 