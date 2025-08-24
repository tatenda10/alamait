import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DynamicSidebar from './DynamicSidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();
  const [currentSection, setCurrentSection] = useState('configuration');

  // Determine current section based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/students')) {
      setCurrentSection('students');
    } else if (path.includes('/accounting') || path.includes('/expenses') || path.includes('/income') || path.includes('/petty-cash') || path.includes('/suppliers') || path.includes('/chart-of-accounts')) {
      setCurrentSection('accounting');
    } else if (path.includes('/reports')) {
      setCurrentSection('reports');
    } else {
      setCurrentSection('configuration');
    }
  }, [location.pathname]);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <DynamicSidebar currentSection={currentSection} />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        <Navbar onSectionChange={handleSectionChange} currentSection={currentSection} />
        <main className="flex-1 p-8 mt-16">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 