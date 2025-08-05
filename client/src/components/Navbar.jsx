import React from 'react';
import { FaBell } from 'react-icons/fa';

const Navbar = () => (
  <header className="fixed top-0 left-64 right-0 h-16 bg-white shadow flex items-center px-6 justify-between z-20">
    <div className=" font-bold text-gray-700">Welcome back, Admin</div>
    <div className="flex items-center space-x-4">
      <button className="relative text-gray-400 hover:text-blue-700">
        <FaBell className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
      </button>
      <div className="text-sm  text-gray-900">Admin</div>
    </div>
  </header>
);

export default Navbar; 