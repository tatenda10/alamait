import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDownIcon,
  XMarkIcon,
  Bars3Icon,
  UserCircleIcon,
  HomeIcon,
  UsersIcon,
  KeyIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  ReceiptRefundIcon,
  WalletIcon
} from '@heroicons/react/24/outline';

const defaultNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, exact: true },
  { name: 'Students', href: '/dashboard/students', icon: UsersIcon },
  { name: 'Rooms', href: '/dashboard/rooms', icon: KeyIcon },
  {
    name: 'Accounting',
    icon: CalculatorIcon,
    children: [
      { name: 'Chart of Accounts', href: '/dashboard/accounting/coa' },
      // { name: 'Transactions', href: '/dashboard/accounting/transactions' },
      // { name: 'Journal Entry', href: '/dashboard/accounting/journal' },
      // { name: 'General Ledger', href: '/dashboard/accounting/ledger' },
    ],
  },
  {
    name: 'Suppliers',
    icon: ClipboardDocumentListIcon,
    children: [
      { name: 'Suppliers List', href: '/dashboard/suppliers' },
      { name: 'Add Supplier', href: '/dashboard/suppliers/add' }
    ],
  },
  {
    name: 'Payments',
    icon: BanknotesIcon,
    children: [
      { name: 'Record Payment', href: '/dashboard/student-financials/payments' },
      { name: 'Payment History', href: '/dashboard/student-financials/payment-history' },
      { name: 'Overdue Payments', href: '/dashboard/student-financials/overdue' },
      { name: 'Rent Ledger', href: '/dashboard/student-financials/rent-ledger' }
    ],
  },
  {
    name: 'Expenses',
    icon: ReceiptRefundIcon,
    children: [
      { name: 'Add Expense', href: '/dashboard/expenses/add' },
      { name: 'Expenses List', href: '/dashboard/expenses' }
    ],
  },
  {
    name: 'Petty Cash',
    icon: WalletIcon,
    children: [
      { name: 'Manage Accounts', href: '/dashboard/petty-cash' },
      { name: 'Reconciliation', href: '/dashboard/petty-cash/reconciliation' }
    ],
  },
  {
    name: 'Reports',
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Debtors Report', href: '/dashboard/reports/debtors' },
      { name: 'Cashflow Report', href: '/dashboard/reports/cashflow' },
      { name: 'Income Projection', href: '/dashboard/reports/income-projection' },
      { name: 'Income Statement', href: '/dashboard/reports/income-statement' },
    ],
  },
  { name: 'Change Password', href: '/dashboard/change-password', icon: Cog6ToothIcon },
  { 
    name: 'Logout', 
    icon: ArrowRightOnRectangleIcon,
    onClick: true
  },
];

export default function Sidebar({ navigation = defaultNavigation, isOpen, setIsOpen, user }) {
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Get user and boarding house info from localStorage
  const storedUser = localStorage.getItem('user');
  const userInfo = storedUser ? JSON.parse(storedUser) : null;
  
  // Debug logging
  console.log('LocalStorage Data:', {
    storedUser: userInfo,
    token: localStorage.getItem('token'),
    boardingHouseId: localStorage.getItem('boarding_house_id'),
    boardingHouseName: localStorage.getItem('boarding_house_name')
  });

  const boardingHouseName = localStorage.getItem('boarding_house_name') || 'Boarding House';

  const handleLogout = async () => {
    await logout();
    localStorage.clear();
    navigate('/');
  };

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const renderNavItem = (item) => {
    if (!item || !item.name) return null;

    if (item.children) {
      return (
        <div key={item.name} className="px-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className="w-full group flex items-center gap-x-3 rounded-md p-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />}
            {item.name}
            <ChevronDownIcon
              className={`ml-auto h-3 w-3 shrink-0 text-gray-400 transition-transform ${
                openMenus[item.name] ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openMenus[item.name] && item.children && (
            <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-2">
              {item.children.map((child) => (
                child && child.name && (
                  <NavLink
                    key={child.name}
                    to={child.href}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md py-1 px-2 text-sm font-medium ${
                        isActive
                          ? 'bg-gray-100 text-[#E78D69]'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {child.name}
                  </NavLink>
                )
              ))}
            </div>
          )}
          <div className="border-b border-gray-200 my-1" />
        </div>
      );
    }

    if (item.onClick) {
      return (
        <div key={item.name} className="px-1">
          <button
            onClick={handleLogout}
            className="w-full group flex items-center gap-x-3 rounded-md p-1.5 text-sm font-medium text-[#E78D69] hover:bg-gray-100"
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0 text-[#E78D69]" aria-hidden="true" />}
            {item.name}
          </button>
          <div className="border-b border-gray-200 my-1" />
        </div>
      );
    }

    return (
      <div key={item.name} className="px-1">
        <NavLink
          end={item.exact}
          to={item.href}
          className={({ isActive }) =>
            `group flex gap-x-3 rounded-md p-1.5 text-sm font-medium ${
              isActive
                ? 'bg-gray-100 text-[#E78D69]'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          {item.icon && <item.icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />}
          {item.name}
        </NavLink>
        <div className="border-b border-gray-200 my-1" />
      </div>
    );
  };

  const renderUserProfile = () => {
    return (
      <div className="mt-auto border-t border-gray-200 py-3 px-2">
        <div className="flex items-center gap-x-3 p-2 rounded-md hover:bg-gray-100">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {userInfo?.username || 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {userInfo?.email || 'user@example.com'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="fixed top-0 right-0 z-50 lg:hidden">
        <button
          type="button"
          className="m-3 rounded-md bg-white p-2 text-gray-600 shadow-lg ring-1 ring-gray-200 hover:bg-gray-50"
          onClick={() => setIsOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsOpen}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col overflow-y-auto bg-white pb-2 shadow-xl">
                  <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
                    <span className="text-base font-semibold text-gray-900">{boardingHouseName}</span>
                  </div>
                  <nav className="flex-1 px-4 mt-4 overflow-y-hidden">
                    <ul role="list" className="flex flex-1 flex-col gap-y-1">
                      {navigation.map((item) => (
                        item && <li key={item.name}>{renderNavItem(item)}</li>
                      ))}
                    </ul>
                  </nav>
                  {renderUserProfile()}
                </div>
                <button
                  type="button"
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-white pb-2 shadow-xl">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
            <span className="text-base font-semibold text-gray-900">{boardingHouseName}</span>
          </div>
          <nav className="flex-1 px-4 mt-4 overflow-y-hidden">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => (
                item && <li key={item.name}>{renderNavItem(item)}</li>
              ))}
            </ul>
          </nav>
          {renderUserProfile()}
        </div>
      </div>
    </>
  );
}