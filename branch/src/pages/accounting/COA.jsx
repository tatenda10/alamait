import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import BASE_URL from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Account Type Constants
const ACCOUNT_TYPES = {
  ASSET: { name: 'Asset', prefix: '1' },
  LIABILITY: { name: 'Liability', prefix: '2' },
  EQUITY: { name: 'Equity', prefix: '3' },
  REVENUE: { name: 'Revenue', prefix: '4' },
  EXPENSE: { name: 'Expense', prefix: '5' }
};

const COA = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: ACCOUNT_TYPES.ASSET.name,
    isCategory: false,
    parentId: null
  });

  // Function to get the next available code for a given type and parent
  const generateNextCode = (type, parentId = null) => {
    const typePrefix = Object.values(ACCOUNT_TYPES).find(t => t.name === type)?.prefix || '1';
    const parentAccount = parentId ? accounts.find(a => a.id === parentId) : null;
    
    let relevantAccounts;
    if (parentAccount) {
      // If parent exists, look for siblings under the same parent
      relevantAccounts = accounts.filter(a => a.parentId === parentId);
    } else {
      // If no parent, look for root accounts of the same type
      relevantAccounts = accounts.filter(a => 
        a.type === type && 
        !a.parentId && 
        a.code.startsWith(typePrefix)
      );
    }

    if (relevantAccounts.length === 0) {
      // If no existing accounts, start with base number
      return parentAccount ? parentAccount.code + '10' : typePrefix + '000';
    }

    // Find the highest code number and increment
    const highestCode = Math.max(...relevantAccounts.map(a => parseInt(a.code)));
    return (highestCode + 10).toString().padStart(4, '0');
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const newCode = generateNextCode(newType, editingAccount ? editingAccount.parentId : newAccount.parentId);
    
    if (editingAccount) {
      setEditingAccount(prev => ({
        ...prev,
        type: newType,
        code: newCode
      }));
    } else {
      setNewAccount(prev => ({
        ...prev,
        type: newType,
        code: newCode
      }));
    }
  };

  const handleParentChange = (e) => {
    const newParentId = e.target.value || null;
    const currentType = editingAccount ? editingAccount.type : newAccount.type;
    const newCode = generateNextCode(currentType, newParentId);
    
    if (editingAccount) {
      setEditingAccount(prev => ({
        ...prev,
        parentId: newParentId,
        code: newCode
      }));
    } else {
      setNewAccount(prev => ({
        ...prev,
        parentId: newParentId,
        code: newCode
      }));
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      if (!boardingHouseId || !token) {
        throw new Error('Authentication data missing. Please log in again.');
      }

      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'boarding-house-id': boardingHouseId,
          'Authorization': `Bearer ${token}`
        }
      });
      setAccounts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch accounts');
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingAccount) {
      setEditingAccount(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewAccount(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (submitError) setSubmitError(null);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (editingAccount) {
      setEditingAccount(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setNewAccount(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitError(null);
      const accountData = editingAccount ? editingAccount : newAccount;
      
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      if (!boardingHouseId || !token) {
        throw new Error('Authentication data missing. Please log in again.');
      }

      if (editingAccount) {
        await axios.put(`${BASE_URL}/coa/${editingAccount.id}`, accountData, {
          headers: {
            'boarding-house-id': boardingHouseId,
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Account updated successfully');
      } else {
        await axios.post(`${BASE_URL}/coa`, accountData, {
          headers: {
            'boarding-house-id': boardingHouseId,
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Account created successfully');
      }
      
      await fetchAccounts();
      setIsModalOpen(false);
      setEditingAccount(null);
      setNewAccount({
        code: '',
        name: '',
        type: ACCOUNT_TYPES.ASSET.name,
        isCategory: false,
        parentId: null
      });
    } catch (error) {
      console.error('Error saving account:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save account';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount({
      ...account,
      parentId: account.parentId || null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      if (!boardingHouseId || !token) {
        throw new Error('Authentication data missing. Please log in again.');
      }

      await axios.delete(`${BASE_URL}/coa/${accountId}`, {
        headers: {
          'boarding-house-id': boardingHouseId,
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Account deleted successfully');
      await fetchAccounts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account';
      toast.error(errorMessage);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading accounts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const renderAccount = (account, level = 0) => {
    const isExpanded = expandedCategories[account.id];
    const hasChildren = account.children && account.children.length > 0;

    return (
      <tr key={account.id} className="hover:bg-gray-50">
        <td className="py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-4 border-x border-gray-200">
          <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => toggleCategory(account.id)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" /> // Spacer for alignment
            )}
            {account.code}
          </div>
        </td>
        <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
          {account.name}
        </td>
        <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
          {account.type}
        </td>
        <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-4 border-r border-gray-200">
          <button 
            onClick={() => handleEdit(account)}
            className="text-blue-600 hover:text-blue-900 mr-3"
          >
            <PencilIcon className="h-4 w-4 inline-block" />
          </button>
          <button 
            onClick={() => handleDelete(account.id)}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-4 w-4 inline-block" />
          </button>
        </td>
      </tr>
    );
  };

  const renderChildAccounts = (account, level = 0) => {
    if (account.children && expandedCategories[account.id]) {
      return account.children.map(child => (
        <React.Fragment key={child.id}>
          {renderAccount(child, level + 1)}
          {renderChildAccounts(child, level + 1)}
        </React.Fragment>
      ));
    }
    return null;
  };

  // Add parent account selection to the form
  const renderParentAccountSelect = () => {
    const flattenAccounts = (accs, result = []) => {
      if (!Array.isArray(accs)) return result;
      
      accs.forEach(acc => {
        if (acc && acc.isCategory) {
          result.push(acc);
          if (Array.isArray(acc.children)) {
            flattenAccounts(acc.children, result);
          }
        }
      });
      return result;
    };

    const availableParents = flattenAccounts(accounts);

    return (
      <div>
        <label htmlFor="parentId" className="block text-xs font-medium text-gray-700 mb-1">
          Parent Account
        </label>
        <select
          name="parentId"
          id="parentId"
          value={editingAccount ? (editingAccount.parentId || '') : (newAccount.parentId || '')}
          onChange={handleParentChange}
          className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">No Parent (Root Account)</option>
          {availableParents.map(parent => (
            <option 
              key={parent.id} 
              value={parent.id}
              disabled={editingAccount && editingAccount.id === parent.id}
            >
              {parent.code} - {parent.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">
          Account Type <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          id="type"
          value={editingAccount ? editingAccount.type : newAccount.type}
          onChange={handleTypeChange}
          className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={editingAccount !== null} // Prevent type change when editing
        >
          {Object.values(ACCOUNT_TYPES).map(({name}) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {renderParentAccountSelect()}

      <div>
        <label htmlFor="code" className="block text-xs font-medium text-gray-700 mb-1">
          Account Code
        </label>
        <input
          type="text"
          name="code"
          id="code"
          value={editingAccount ? editingAccount.code : newAccount.code}
          className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
          disabled
        />
        <p className="mt-1 text-xs text-gray-500">Auto-generated based on type and parent account</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
          Account Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={editingAccount ? editingAccount.name : newAccount.name}
          onChange={handleInputChange}
          className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isCategory"
          id="isCategory"
          checked={editingAccount ? editingAccount.isCategory : newAccount.isCategory}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isCategory" className="ml-2 block text-sm text-gray-900">
          This is a category
        </label>
      </div>

      <div className="mt-5 sm:mt-4 flex justify-end space-x-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          className="inline-flex justify-center bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center bg-[#E78D69] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
        >
          {editingAccount ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Chart of Accounts</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Manage your organization's financial accounts structure
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={async () => {
              try {
                if (!window.confirm('This will generate a standard Chart of Accounts. Any existing accounts will remain unchanged. Continue?')) {
                  return;
                }
                const response = await axios.post(`${BASE_URL}/coa/generate-standard`, {}, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                toast.success('Standard Chart of Accounts generated successfully');
                await fetchAccounts();
              } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to generate standard Chart of Accounts';
                toast.error(errorMessage);
              }
            }}
            className="inline-block bg-[#02031E] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#02031E]/90"
          >
            Generate Standard COA
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingAccount(null);
              setIsModalOpen(true);
            }}
            className="inline-block bg-[#E78D69] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
          >
            <PlusIcon className="inline-block h-4 w-4 mr-1" />
            Add Account
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 flow-root">
        <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-sm overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-4">
                    Account Code
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(accounts) && accounts.length > 0 ? (
                  accounts.map(account => (
                    <React.Fragment key={account.id}>
                      {renderAccount(account)}
                      {renderChildAccounts(account)}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-3 py-4 text-sm text-center text-gray-500">
                      {loading ? 'Loading accounts...' : 'No accounts available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-60" onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="bg-white text-gray-400 hover:text-gray-500"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-3">
                        {editingAccount ? 'Edit Account' : 'Add New Account'}
                      </Dialog.Title>

                      {submitError && (
                        <div className="mt-2 p-2 text-xs text-red-600 bg-red-50 rounded-md">
                          {submitError}
                        </div>
                      )}

                      {renderForm()}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default COA;
