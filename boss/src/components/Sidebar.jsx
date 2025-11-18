import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDownIcon,
  XMarkIcon,
  Bars3Icon,
  UserCircleIcon,
  HomeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  HomeModernIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const defaultNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, exact: true },
  { name: 'Income Statement', href: '/dashboard/income-statement', icon: DocumentTextIcon },
  { name: 'Cashflow', href: '/dashboard/cashflow', icon: BanknotesIcon },
  { name: 'Balance Sheet', href: '/dashboard/balance-sheet', icon: DocumentTextIcon },
  { name: 'Expenses Report', href: '/dashboard/expenses-report', icon: DocumentTextIcon },
  { name: 'Beds and Rooms', href: '/dashboard/beds-rooms', icon: HomeModernIcon },
  { name: 'Expenditure Requests', href: '/dashboard/expenditure-requests', icon: ClipboardDocumentCheckIcon },
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

  const storedUser = localStorage.getItem('user');
  const userInfo = storedUser ? JSON.parse(storedUser) : null;
  const userName = userInfo?.username || 'Boss';

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
                          ? 'bg-gray-100 text-[#f58020]'
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
            className="w-full group flex items-center gap-x-3 rounded-md p-1.5 text-sm font-medium text-[#f58020] hover:bg-gray-100"
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0 text-[#f58020]" aria-hidden="true" />}
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
                ? 'bg-gray-100 text-[#f58020]'
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
              {userInfo?.username || 'Boss'}
            </span>
            <span className="text-xs text-gray-500">
              {userInfo?.email || 'boss@alamait.com'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
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
                    <span className="text-base font-semibold text-gray-900">Boss Portal</span>
                  </div>
                  <nav className="flex-1 px-4 mt-4 overflow-y-auto">
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
        <div className="flex grow flex-col overflow-y-auto bg-white pb-2 shadow-xl border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
            <span className="text-base font-semibold text-gray-900">Boss Portal</span>
          </div>
          <nav className="flex-1 px-4 mt-4 overflow-y-auto">
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

