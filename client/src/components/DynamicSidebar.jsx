import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  // Configuration icons
  FaTachometerAlt,
  FaBuilding,
  FaDoorOpen,
  FaUsers,
  
  // Students icons
  FaUserGraduate,
  FaUserPlus,
  FaClipboardList,
  FaCalendarAlt,
  FaMoneyBill,
  
  // Accounting icons
  FaCalculator,
  FaBook,
  FaReceipt,
  FaWallet,
  FaTruck,
  FaExchangeAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaChartLine,
  FaBalanceScale,
  FaHandHoldingUsd,
  
  // Reports icons
  FaChartBar,
  FaFileInvoiceDollar,
  FaChartPie,
  FaTable,
  FaDownload,
  
  // Common icons
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt
} from 'react-icons/fa';

const HOVER_COLOR = 'hover:bg-gray-100';

const DynamicSidebar = ({ currentSection }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const navigate = useNavigate();

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderDashboardMenu = () => (
    <div className="space-y-0">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Dashboard
      </div>
    </div>
  );

  const renderConfigurationMenu = () => (
    <div className="space-y-0">
      
      <NavLink 
        to="/dashboard/boarding-houses" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaBuilding className="h-5 w-5 mr-3" /> Boarding Houses
      </NavLink>
      
      <NavLink 
        to="/dashboard/rooms" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaDoorOpen className="h-5 w-5 mr-3" /> Rooms
      </NavLink>
      
      <NavLink 
        to="/dashboard/users" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaUsers className="h-5 w-5 mr-3" /> User Management
      </NavLink>
    </div>
  );

  const renderStudentsMenu = () => (
    <div className="space-y-0">
      <NavLink 
        to="/dashboard/students" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaUserGraduate className="h-5 w-5 mr-3" /> All Students
      </NavLink>
      
      <NavLink 
        to="/dashboard/students/add" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaUserPlus className="h-5 w-5 mr-3" /> Add Student
      </NavLink>
    </div>
  );

  const renderAccountingMenu = () => (
    <div className="space-y-0">
      <NavLink 
        to="/dashboard/chart-of-accounts" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaBook className="h-5 w-5 mr-3" /> Chart of Accounts
      </NavLink>
      
      <NavLink 
        to="/dashboard/banking" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaHandHoldingUsd className="h-5 w-5 mr-3" /> Cash and Bank
      </NavLink>
      

      
      <div>
        <button
          onClick={() => toggleSection('expenses')}
          className={`flex items-center justify-between w-full px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} text-left text-gray-700`}
        >
          <div className="flex items-center">
            <FaReceipt className="h-5 w-5 mr-3" /> Expenses
          </div>
          {expandedSections.expenses ? (
            <FaChevronDown className="h-3 w-3" />
          ) : (
            <FaChevronRight className="h-3 w-3" />
          )}
        </button>
        
        {expandedSections.expenses && (
          <div className="ml-6 space-y-0">
            <NavLink 
              to="/dashboard/expenses" 
              className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-600'}`}
            >
              <FaReceipt className="h-4 w-4 mr-2" /> All Expenses
            </NavLink>
            <NavLink 
              to="/dashboard/expenses/add" 
              className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-600'}`}
            >
              <FaFileAlt className="h-4 w-4 mr-2" /> Add Expense
            </NavLink>
            <NavLink 
              to="/dashboard/expenses/accounts-payable" 
              className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-600'}`}
            >
              <FaExclamationTriangle className="h-4 w-4 mr-2" /> Accounts Payable
            </NavLink>
          </div>
        )}
      </div>
      
      <NavLink 
        to="/dashboard/income" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaMoneyBill className="h-5 w-5 mr-3" /> Income
      </NavLink>
      
      <NavLink 
        to="/dashboard/accounting/bank-reconciliation" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaBalanceScale className="h-5 w-5 mr-3" /> Bank Reconciliation
      </NavLink>
      
      {/* <NavLink 
        to="/dashboard/accounting/balance-bd-cd" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaChartLine className="h-5 w-5 mr-3" /> Balance BD/CD
      </NavLink> */}
      
      <NavLink 
        to="/dashboard/petty-cash" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaWallet className="h-5 w-5 mr-3" /> Petty Cash
      </NavLink>
      
      <NavLink 
        to="/dashboard/suppliers" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaTruck className="h-5 w-5 mr-3" /> Suppliers
      </NavLink>
    </div>
  );

  const renderReportsMenu = () => (
    <div className="space-y-0">
      <NavLink 
        to="/dashboard/reports/income-statement" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaChartLine className="h-5 w-5 mr-3" /> Income Statement
      </NavLink>
      
      <NavLink 
        to="/dashboard/reports/cashflow" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaExchangeAlt className="h-5 w-5 mr-3" /> Cashflow Report
      </NavLink>
      
      <NavLink 
        to="/dashboard/reports/debtors" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaFileInvoiceDollar className="h-5 w-5 mr-3" /> Debtors Report
      </NavLink>
      
      <NavLink 
        to="/dashboard/reports/creditors" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaTruck className="h-5 w-5 mr-3" /> Creditors Report
      </NavLink>
      
      <NavLink 
        to="/dashboard/reports/expenses" 
        className={({ isActive }) => `flex items-center px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} ${isActive ? 'text-[#f58020] font-bold bg-[#f58020]/10 border-b-[#f58020]' : 'text-gray-700'}`}
      >
        <FaReceipt className="h-5 w-5 mr-3" /> Expenses Report
      </NavLink>
      
    </div>
  );

  const renderMenu = () => {
    switch (currentSection) {
      case 'dashboard':
        return renderDashboardMenu();
      case 'configuration':
        return renderConfigurationMenu();
      case 'students':
        return renderStudentsMenu();
      case 'accounting':
        return renderAccountingMenu();
      case 'reports':
        return renderReportsMenu();
      default:
        return renderConfigurationMenu();
    }
  };

  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col fixed h-full z-20 border-r border-gray-200">
      {/* Alamait Logo */}
      <div className="px-6 py-4">
        <span className="text-xl font-extrabold tracking-tight text-gray-900">Alamait</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        {renderMenu()}
      </nav>
      
      {/* Logout Button - Always visible at bottom */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-3 transition font-medium border-b border-gray-200 ${HOVER_COLOR} text-red-600 hover:text-red-700 hover:bg-red-50`}
        >
          <FaSignOutAlt className="h-5 w-5 mr-3" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default DynamicSidebar;
