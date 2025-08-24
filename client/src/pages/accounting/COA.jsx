import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEdit2, FiTrash2, FiFilter, FiDownload, FiX, FiChevronDown, FiChevronRight, FiPlus, FiEye } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

// Add Account Modal Component
const AccountModal = ({ isOpen, onClose, onSubmit, selectedAccount, accounts }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    is_category: false,
    parent_id: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      setFormData({
        name: selectedAccount.name,
        type: selectedAccount.type,
        is_category: selectedAccount.is_category,
        parent_id: selectedAccount.parent_id
      });
    }
  }, [selectedAccount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedAccount ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type*</label>
            <select
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select type</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Parent Account</label>
            <select
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
            >
              <option value="">None</option>
              {accounts.map((account) => (
                <option 
                  key={account.id} 
                  value={account.id}
                  disabled={account.id === selectedAccount?.id}
                >
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_category"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_category}
              onChange={(e) => setFormData({ ...formData, is_category: e.target.checked })}
            />
            <label htmlFor="is_category" className="ml-2 block text-xs text-gray-700">
              Is Category
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#E78D69' }}
            >
              {loading ? 'Saving...' : selectedAccount ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



const COA = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [openModal, setOpenModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAccounts(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching accounts:', error);
      console.log(error.response?.data);
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccounts();
    }
  }, [token]);

  // Handle row expansion
  const toggleRowExpansion = (accountId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(accountId)) {
      newExpandedRows.delete(accountId);
    } else {
      newExpandedRows.add(accountId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      if (selectedAccount) {
        await axios.put(`${BASE_URL}/coa/${selectedAccount.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post(`${BASE_URL}/coa`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      fetchAccounts();
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to save account');
    }
  };

  // Handle account deletion
  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await axios.delete(`${BASE_URL}/coa/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  // Filter accounts based on search term
  const filterAccounts = (accounts, searchTerm) => {
    if (!searchTerm) return accounts;
    
    const searchLower = searchTerm.toLowerCase();
    return accounts.filter(account => {
      const matchesSearch = 
        account.code.toLowerCase().includes(searchLower) ||
        account.name.toLowerCase().includes(searchLower);
      
      if (matchesSearch) return true;
      
      if (account.children && account.children.length > 0) {
        account.children = filterAccounts(account.children, searchTerm);
        return account.children.length > 0;
      }
      
      return false;
    });
  };

  // Render account rows recursively
  const renderAccountRows = (accounts, level = 0) => {
    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedRows.has(account.id);
      
      return (
        <React.Fragment key={account.id}>
          <tr className={`text-xs text-gray-700 hover:bg-gray-50 ${level === 0 ? 'bg-gray-50' : ''}`}>
            <td className="px-6 py-4">
              <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasChildren && (
                  <button
                    onClick={() => toggleRowExpansion(account.id)}
                    className="mr-2 text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                )}
                {account.code}
              </div>
            </td>
            <td className="px-6 py-4">{account.name}</td>
            <td className="px-6 py-4">{account.type}</td>
            <td className="px-6 py-4 text-right space-x-3">
              <button 
                className="text-gray-600 hover:text-green-600 transition-colors"
                onClick={() => navigate(`/dashboard/account-transactions/${account.id}`)}
                title="View Transactions"
              >
                <FiEye size={14} />
              </button>
              <button 
                className="text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => {
                  setSelectedAccount(account);
                  setOpenModal(true);
                }}
                title="Edit Account"
              >
                <FiEdit2 size={14} />
              </button>
              <button 
                className="text-gray-600 hover:text-red-600 transition-colors"
                onClick={() => handleDelete(account.id)}
                title="Delete Account"
              >
                <FiTrash2 size={14} />
              </button>
            </td>
          </tr>
          {hasChildren && isExpanded && renderAccountRows(account.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  // Filter accounts based on search term
  const filteredAccounts = filterAccounts(accounts, searchTerm);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Chart of Accounts</h1>
        <p className="text-xs text-gray-500">Manage your organization's global chart of accounts</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiDownload size={14} />
              <span>Export</span>
            </button>

            <button 
              onClick={() => {
                setSelectedAccount(null);
                setOpenModal(true);
              }}
              className="flex items-center px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#E78D69' }}
            >
              <FiPlus size={14} className="mr-2" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Code</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                renderAccountRows(filteredAccounts)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedAccount(null);
        }}
        onSubmit={handleSubmit}
        selectedAccount={selectedAccount}
        accounts={accounts}
      />


    </div>
  );
};

export default COA;
