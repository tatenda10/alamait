import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';

const PettyCash = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    account_name: '',
    assigned_user_id: '',
    initial_balance: 0
  });

  const [issuanceForm, setIssuanceForm] = useState({
    amount: '',
    purpose: '',
    reference_number: '',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    expense_category: '',
    vendor_name: '',
    receipt_number: '',
    notes: '',
    receipt: null
  });

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      const response = await axios.get('/api/petty-cash/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      // Ensure we always set an array, even if the response is unexpected
      const accountsData = response.data?.data || response.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch petty cash accounts');
      // Set empty array on error to prevent undefined issues
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      const response = await axios.get('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      // Ensure we always set an array, even if the response is unexpected
      const usersData = response.data?.data || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty array on error to prevent undefined issues
      setUsers([]);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      await axios.post('/api/petty-cash/accounts', createForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      toast.success('Petty cash account created successfully');
      setShowCreateModal(false);
      setCreateForm({ account_name: '', assigned_user_id: '', initial_balance: 0 });
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create petty cash account');
    }
  };

  const handleIssueCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      await axios.post('/api/petty-cash/issuance', {
        petty_cash_account_id: selectedAccount.id,
        ...issuanceForm
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      toast.success('Cash issued successfully');
      setShowIssueModal(false);
      setIssuanceForm({ amount: '', purpose: '', reference_number: '', notes: '' });
      fetchAccounts();
    } catch (error) {
      console.error('Error issuing cash:', error);
      toast.error('Failed to issue cash');
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      const formData = new FormData();
      formData.append('petty_cash_account_id', selectedAccount.id);
      Object.keys(expenseForm).forEach(key => {
        if (key === 'receipt' && expenseForm[key]) {
          formData.append('receipt', expenseForm[key]);
        } else if (key !== 'receipt') {
          formData.append(key, expenseForm[key]);
        }
      });
      
      await axios.post('/api/petty-cash/expenses', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Expense recorded successfully');
      setShowExpenseModal(false);
      setExpenseForm({
        amount: '', description: '', expense_category: '', vendor_name: '',
        receipt_number: '', notes: '', receipt: null
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error recording expense:', error);
      toast.error('Failed to record expense');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Petty Cash Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts && accounts.length > 0 && accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{account.account_name}</h3>
                <p className="text-sm text-gray-500">Code: {account.account_code}</p>
                <p className="text-sm text-gray-500">Assigned to: {account.assigned_user_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${parseFloat(account.current_balance || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Current Balance</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setShowIssueModal(true);
                }}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                Issue Cash
              </button>
              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setShowExpenseModal(true);
                }}
                className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 flex items-center justify-center gap-1"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Record Expense
              </button>
              <button
                onClick={() => {
                  // Navigate to ledger view
                  navigate(`/dashboard/petty-cash/ledger/${account.id}`);
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!accounts || accounts.length === 0) && !loading && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No petty cash accounts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new petty cash account.</p>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Petty Cash Account</h3>
            <form onSubmit={handleCreateAccount}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  required
                  value={createForm.account_name}
                  onChange={(e) => setCreateForm({...createForm, account_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned User</label>
                <select
                  required
                  value={createForm.assigned_user_id}
                  onChange={(e) => setCreateForm({...createForm, assigned_user_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users && users.length > 0 && users.map((user) => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.initial_balance}
                  onChange={(e) => setCreateForm({...createForm, initial_balance: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Cash Modal */}
      {showIssueModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Issue Cash - {selectedAccount.account_name}
            </h3>
            <form onSubmit={handleIssueCash}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={issuanceForm.amount}
                  onChange={(e) => setIssuanceForm({...issuanceForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                <input
                  type="text"
                  required
                  value={issuanceForm.purpose}
                  onChange={(e) => setIssuanceForm({...issuanceForm, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={issuanceForm.reference_number}
                  onChange={(e) => setIssuanceForm({...issuanceForm, reference_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={issuanceForm.notes}
                  onChange={(e) => setIssuanceForm({...issuanceForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Issue Cash
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Record Expense - {selectedAccount.account_name}
            </h3>
            <form onSubmit={handleRecordExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={expenseForm.expense_category}
                  onChange={(e) => setExpenseForm({...expenseForm, expense_category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Meals">Meals</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                <input
                  type="text"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({...expenseForm, vendor_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
                <input
                  type="text"
                  value={expenseForm.receipt_number}
                  onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Upload</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setExpenseForm({...expenseForm, receipt: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, PDF (max 5MB)</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCash;