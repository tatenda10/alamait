/**
 * Sidebar.jsx - updated for new structure and compact font
 */
import React, { useState } from 'react';
import {
  FaTachometerAlt,
  FaBuilding,
  FaBook,
  FaExchangeAlt,
  FaFileAlt,
  FaUsers,
  FaChartBar,
  FaBars,
  FaUserGraduate,
  FaMoneyBill,
  FaReceipt,
  FaWallet,
  FaChevronDown,
  FaChevronRight,
  FaChartLine,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaDoorOpen,
  FaTruck
} from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';

const HOVER_COLOR = 'hover:bg-gray-100';

const Sidebar = () => {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const navigate = useNavigate();

  const toggleReports = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  const togglePettyCash = () => {
    setIsPettyCashOpen(!isPettyCashOpen);
  };

  const toggleExpenses = () => {
    setIsExpensesOpen(!isExpensesOpen);
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };
  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col py-8 px-4 fixed h-full z-10 text-xs border-r border-gray-200 shadow-sm">
      <div className="flex items-center mb-10 flex-row-reverse justify-between">
        <FaBars className="h-5 w-5 text-gray-600 cursor-pointer" />
        <span className="text-xl font-extrabold tracking-tight text-gray-900">Alamait</span>
      </div>
      <nav className="flex-1 space-y-2">
        {/* Dashboard */}
        <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaTachometerAlt className="h-5 w-5 mr-2" /> Dashboard
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Boarding Houses */}
        <NavLink to="/dashboard/boarding-houses" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaBuilding className="h-5 w-5 mr-2" /> Boarding Houses
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Rooms */}
        <NavLink to="/dashboard/rooms" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaDoorOpen className="h-5 w-5 mr-2" /> Rooms
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Chart of Accounts */}
        <NavLink to="/dashboard/chart-of-accounts" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaBook className="h-5 w-5 mr-2" /> Chart of Accounts
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Expenses */}
        <div>
          <button
            onClick={toggleExpenses}
            className={`flex items-center justify-between w-full px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} text-left text-gray-700`}
          >
            <div className="flex items-center">
              <FaReceipt className="h-5 w-5 mr-2" /> Expenses
            </div>
            {isExpensesOpen ? (
              <FaChevronDown className="h-3 w-3" />
            ) : (
              <FaChevronRight className="h-3 w-3" />
            )}
          </button>
          
          {isExpensesOpen && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink 
                to="/dashboard/expenses" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaReceipt className="h-4 w-4 mr-2" /> All Expenses
              </NavLink>
              <NavLink 
                to="/dashboard/expenses/accounts-payable" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaFileAlt className="h-4 w-4 mr-2" /> Accounts Payable
              </NavLink>
            </div>
          )}
        </div>
        <div className="border-b border-gray-200 my-1" />

        {/* Income */}
        <NavLink to="/dashboard/income" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaMoneyBill className="h-5 w-5 mr-2" /> Income
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Petty Cash */}
        <div>
          <button
            onClick={togglePettyCash}
            className={`flex items-center justify-between w-full px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} text-left text-gray-700`}
          >
            <div className="flex items-center">
              <FaWallet className="h-5 w-5 mr-2" /> Petty Cash
            </div>
            {isPettyCashOpen ? (
              <FaChevronDown className="h-3 w-3" />
            ) : (
              <FaChevronRight className="h-3 w-3" />
            )}
          </button>
          
          {isPettyCashOpen && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink 
                to="/dashboard/petty-cash" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaWallet className="h-4 w-4 mr-2" /> Manage Users
              </NavLink>
              <NavLink 
                to="/dashboard/petty-cash/pending-expenses" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaExclamationTriangle className="h-4 w-4 mr-2" /> Pending Expenses
              </NavLink>
            </div>
          )}
        </div>
        <div className="border-b border-gray-200 my-1" />

        {/* Suppliers */}
        <NavLink to="/dashboard/suppliers" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaTruck className="h-5 w-5 mr-2" /> Suppliers
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Reports */}
        <div>
          <button
            onClick={toggleReports}
            className={`flex items-center justify-between w-full px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} text-left text-gray-700`}
          >
            <div className="flex items-center">
              <FaChartBar className="h-5 w-5 mr-2" /> Reports
            </div>
            {isReportsOpen ? (
              <FaChevronDown className="h-3 w-3" />
            ) : (
              <FaChevronRight className="h-3 w-3" />
            )}
          </button>
          
          {isReportsOpen && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink 
                to="/dashboard/reports/income-statement" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaChartLine className="h-4 w-4 mr-2" /> Income Statement
              </NavLink>
              <NavLink 
                to="/dashboard/reports/debtors" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaExclamationTriangle className="h-4 w-4 mr-2" /> Debtors Report
              </NavLink>
              <NavLink 
                to="/dashboard/reports/creditors" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaTruck className="h-4 w-4 mr-2" /> Creditors Report
              </NavLink>
              <NavLink 
                to="/dashboard/reports/cashflow" 
                className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-600'}`}
              >
                <FaExchangeAlt className="h-4 w-4 mr-2" /> Cashflow Report
              </NavLink>
            </div>
          )}
        </div>
        <div className="border-b border-gray-200 my-1" />

        {/* User Management */}
        <NavLink to="/dashboard/users" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaUsers className="h-5 w-5 mr-2" /> User Management
        </NavLink>
        <div className="border-b border-gray-200 my-1" />

        {/* Students */}
        <NavLink to="/dashboard/students" className={({ isActive }) => `flex items-center px-3 py-1 transition font-medium rounded-md ${HOVER_COLOR} ${isActive ? 'text-[#E78D69] font-bold bg-[#E78D69]/10' : 'text-gray-700'}`}>
          <FaUserGraduate className="h-5 w-5 mr-2" /> Students
        </NavLink>
        <div className="border-b border-gray-200 my-1" />
      </nav>
      
      <div className="mt-auto pt-8">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 transition font-medium ${HOVER_COLOR} text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md`}
        >
          <FaSignOutAlt className="h-5 w-5 mr-2" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;