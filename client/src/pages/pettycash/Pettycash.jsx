import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaDollarSign,
  FaCalendarAlt,
  FaArrowDown,
  FaUser
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const PettyCash = () => {
  const [loading, setLoading] = useState(true);
  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Petty cash data
  const [pettyCashData, setPettyCashData] = useState({
    accounts: [],
    total_balance: 0,
    total_accounts: 0
  });

  // Transaction history state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Form states
  const [addCashForm, setAddCashForm] = useState({
    amount: '',
    description: '',
    reference_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    source_account: '10002',
    user_id: '',
    account_id: ''
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    purpose: '',
    reference_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    destination_account: '10002',
    user_id: '',
    account_id: ''
  });

  useEffect(() => {
    fetchPettyCashData();
  }, []);

  const fetchPettyCashData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all petty cash users/accounts for admin view
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const users = response.data.users || [];
      const totalBalance = users.reduce((sum, user) => sum + parseFloat(user.current_balance || 0), 0);
      
      setPettyCashData({
        accounts: users,
        total_balance: totalBalance,
        total_accounts: users.length
      });
    } catch (error) {
      console.error('Error fetching petty cash data:', error);
      toast.error('Failed to fetch petty cash data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/petty-cash/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': userId
        }
      });
      
      setTransactionHistory(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error('Failed to fetch transaction history');
    }
  };

  const handleViewTransactions = (account) => {
    setSelectedAccount(account);
    fetchTransactionHistory(account.user_id);
    setShowTransactionModal(true);
  };

  const handleAddCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const cashData = {
        amount: parseFloat(addCashForm.amount),
        description: addCashForm.description,
        transaction_date: addCashForm.reference_date,
        reference_number: addCashForm.reference_number,
        notes: addCashForm.notes,
        source_account: addCashForm.source_account,
        user_id: addCashForm.user_id,
        account_id: addCashForm.account_id
      };
      
      await axios.post(`${BASE_URL}/petty-cash/add-cash`, cashData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const sourceNames = {
        '10002': 'Cash on Hand',
        '10003': 'CBZ Bank Account',
        '10004': 'CBZ Vault'
      };
      const sourceName = sourceNames[addCashForm.source_account] || 'selected account';
      toast.success(`Cash added successfully from ${sourceName}`);
      setShowAddCashModal(false);
      resetAddCashForm();
      fetchPettyCashData();
    } catch (error) {
      console.error('Error adding cash:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add cash';
      toast.error(errorMessage);
    }
  };

  const handleWithdrawCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const withdrawData = {
        amount: parseFloat(withdrawForm.amount),
        purpose: withdrawForm.purpose,
        transaction_date: withdrawForm.reference_date,
        reference_number: withdrawForm.reference_number,
        notes: withdrawForm.notes,
        destination_account: withdrawForm.destination_account,
        user_id: withdrawForm.user_id,
        account_id: withdrawForm.account_id
      };
      
      await axios.post(`${BASE_URL}/petty-cash/withdraw-cash`, withdrawData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const destinationNames = {
        '10002': 'Cash on Hand',
        '10003': 'CBZ Bank Account',
        '10004': 'CBZ Vault'
      };
      const destinationName = destinationNames[withdrawForm.destination_account] || 'selected account';
      toast.success(`Cash withdrawn successfully to ${destinationName}`);
      setShowWithdrawModal(false);
      resetWithdrawForm();
      fetchPettyCashData();
    } catch (error) {
      console.error('Error withdrawing cash:', error);
      const errorMessage = error.response?.data?.message || 'Failed to withdraw cash';
      toast.error(errorMessage);
    }
  };

  const resetAddCashForm = () => {
    setAddCashForm({
      amount: '',
      description: '',
      reference_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
      source_account: '10002',
      user_id: '',
      account_id: ''
    });
  };

  const resetWithdrawForm = () => {
    setWithdrawForm({
      amount: '',
      purpose: '',
      reference_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
      destination_account: '10002',
      user_id: '',
      account_id: ''
    });
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">All Petty Cash Accounts</h1>
          <p className="text-xs text-gray-500">Overview of all petty cash accounts and their balances</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCashModal(true)}
            className="flex items-center px-3 py-2 text-xs text-white transition-colors"
            style={{ backgroundColor: '#f58020' }}
          >
            <FaPlus size={12} className="mr-1" />
            Add Cash
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center px-3 py-2 text-xs bg-red-600 text-white transition-colors hover:bg-red-700"
          >
            <FaArrowDown size={12} className="mr-1" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Balance</p>
              <p className="text-sm font-bold text-gray-900">${pettyCashData.total_balance?.toFixed(2) || '0.00'}</p>
            </div>
            <FaDollarSign className="h-4 w-4 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Accounts</p>
              <p className="text-sm font-bold text-gray-900">{pettyCashData.total_accounts || 0}</p>
            </div>
            <FaUser className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Average Balance</p>
              <p className="text-sm font-bold text-gray-900">
                ${pettyCashData.total_accounts > 0 ? (pettyCashData.total_balance / pettyCashData.total_accounts).toFixed(2) : '0.00'}
              </p>
            </div>
            <FaCalendarAlt className="h-4 w-4 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Petty Cash Accounts Table */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">All Petty Cash Accounts</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boarding House</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pettyCashData.accounts?.length > 0 ? (
                pettyCashData.accounts.map((account, index) => (
                  <tr key={account.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUser className="h-3 w-3 text-gray-400 mr-2" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {account.username || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {account.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {account.boarding_house_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {account.account_name || 'Petty Cash Account'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {account.account_code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className={`text-xs font-semibold ${
                        parseFloat(account.current_balance) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${parseFloat(account.current_balance || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.status || 'active'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(account.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewTransactions(account)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Transactions
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-3 py-2 text-center text-xs text-gray-500">
                    No petty cash accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cash Modal */}
      {showAddCashModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add Cash to Petty Cash</h3>
              <form onSubmit={handleAddCash}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select User Account*</label>
                  <select
                    required
                    value={`${addCashForm.user_id}|${addCashForm.account_id}`}
                    onChange={(e) => {
                      const [userId, accountId] = e.target.value.split('|');
                      setAddCashForm({...addCashForm, user_id: userId, account_id: accountId});
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a user account</option>
                    {pettyCashData.accounts?.map((account) => (
                      <option key={account.id} value={`${account.user_id}|${account.id}`}>
                        {account.username} - {account.boarding_house_name} (${parseFloat(account.current_balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select which user's petty cash account to add money to
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addCashForm.amount}
                    onChange={(e) => setAddCashForm({...addCashForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={addCashForm.description}
                    onChange={(e) => setAddCashForm({...addCashForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Student cash payment"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source Account*</label>
                  <select
                    required
                    value={addCashForm.source_account}
                    onChange={(e) => setAddCashForm({...addCashForm, source_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select where the money is coming from
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={addCashForm.reference_date}
                    onChange={(e) => setAddCashForm({...addCashForm, reference_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={addCashForm.reference_number}
                    onChange={(e) => setAddCashForm({...addCashForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={addCashForm.notes}
                    onChange={(e) => setAddCashForm({...addCashForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCashModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white transition-colors"
                    style={{ backgroundColor: '#f58020' }}
                  >
                    Add Cash
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Cash Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Withdraw Cash from Petty Cash</h3>
              <form onSubmit={handleWithdrawCash}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select User Account*</label>
                  <select
                    required
                    value={`${withdrawForm.user_id}|${withdrawForm.account_id}`}
                    onChange={(e) => {
                      const [userId, accountId] = e.target.value.split('|');
                      setWithdrawForm({...withdrawForm, user_id: userId, account_id: accountId});
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a user account</option>
                    {pettyCashData.accounts?.map((account) => (
                      <option key={account.id} value={`${account.user_id}|${account.id}`}>
                        {account.username} - {account.boarding_house_name} (${parseFloat(account.current_balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select which user's petty cash account to withdraw money from
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.purpose}
                    onChange={(e) => setWithdrawForm({...withdrawForm, purpose: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Bank deposit"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination Account*</label>
                  <select
                    required
                    value={withdrawForm.destination_account}
                    onChange={(e) => setWithdrawForm({...withdrawForm, destination_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select where the withdrawn money will go
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={withdrawForm.reference_date}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reference_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={withdrawForm.reference_number}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={withdrawForm.notes}
                    onChange={(e) => setWithdrawForm({...withdrawForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Transaction History - {selectedAccount?.username}
                </h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionHistory.length > 0 ? (
                      transactionHistory.map((transaction, index) => (
                        <tr key={transaction.id || index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                                ? 'bg-green-100 text-green-800'
                                : transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.transaction_type === 'cash_inflow' ? 'Cash In' :
                               transaction.transaction_type === 'cash_outflow' ? 'Cash Out' :
                               transaction.transaction_type === 'student_payment' ? 'Student Payment' :
                               transaction.transaction_type === 'withdrawal' ? 'Withdrawal' :
                               transaction.transaction_type === 'expense' ? 'Expense' :
                               transaction.transaction_type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            <div className={`text-xs font-semibold ${
                              transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                                ? `+$${parseFloat(transaction.amount).toFixed(2)}`
                                : `-$${parseFloat(transaction.amount).toFixed(2)}`
                              }
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                            ${parseFloat(transaction.running_balance || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {transaction.reference_number || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-3 py-2 text-center text-xs text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PettyCash;