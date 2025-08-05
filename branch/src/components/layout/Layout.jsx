import React, { useState } from 'react';
import { FiMenu, FiX, FiHome, FiUsers, FiBell, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', icon: FiHome, href: '/dashboard' },
    { name: 'Students', icon: FiUsers, href: '/students' },
    { name: 'Notifications', icon: FiBell, href: '/notifications' },
    { name: 'Settings', icon: FiSettings, href: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 ease-in-out fixed h-full z-30`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isSidebarOpen && (
            <span className="text-xl font-semibold text-gray-800">Branch Portal</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <div className="px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors`}
              >
                <item.icon
                  className={`${
                    isActive(item.href) ? 'text-orange-600' : 'text-gray-400'
                  } mr-3 h-5 w-5`}
                />
                {isSidebarOpen && item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <div className="px-4 py-4">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-medium">JD</span>
                </div>
              </div>
              {isSidebarOpen && (
                <>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">John Doe</p>
                    <p className="text-xs text-gray-500">Branch Admin</p>
                  </div>
                  <FiChevronDown className="ml-auto h-5 w-5 text-gray-400" />
                </>
              )}
            </div>
            {isProfileOpen && isSidebarOpen && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => {/* Handle logout */}}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  <FiLogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm">
          <div className="h-16 flex items-center justify-between px-8">
            <h1 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <FiBell className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 