import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 mt-12">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 