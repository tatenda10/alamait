import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.username || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm lg:fixed lg:w-full lg:pl-64 lg:z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - User initial on mobile, empty on desktop */}
          <div className="flex items-center">
            {/* User initial - only on mobile */}
            <div className="lg:hidden">
              <div className="h-8 w-8 rounded-full bg-[#02031E] flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>

          {/* Right section - User info on desktop, mobile menu on mobile */}
          <div className="flex items-center space-x-4">
            {/* Desktop user info */}
            <div className="hidden lg:flex lg:items-center gap-x-4">
              <div className="h-8 w-8 rounded-full bg-[#02031E] flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user.username}</span>
            </div>

            {/* Desktop logout button */}
            <button
              onClick={handleLogout}
              className="hidden lg:inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              Logout
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 