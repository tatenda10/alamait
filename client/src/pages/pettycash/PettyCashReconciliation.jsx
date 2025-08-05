import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaEye, 
  FaDownload, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaDollarSign,
  FaFileAlt,
  FaCalendarAlt,
  FaUser
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

const PettyCashReconciliation = () => {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [showIssueCashModal, setShowIssueCashModal] = useState(false);
  const [showReduceCashModal, setShowReduceCashModal] = useState(false);
  const [issueCashForm, setIssueCashForm] = useState({
    amount: '',
    purpose: '',
    reference_number: '',
    notes: ''
  });
  const [reduceCashForm, setReduceCashForm] = useState({
    amount: '',
    purpose: '',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    if (accountId) {
      // If accountId is provided, fetch specific account and its transactions
      fetchSpecificAccount(accountId);
    } else {
      // If no accountId, fetch all accounts (general reconciliation view)
      fetchAccounts();
    }
  }, [accountId]);

  useEffect(() => {
    if (selectedAccount && !accountId) {
      fetchTransactions(selectedAccount.id);
    }
  }, [selectedAccount, accountId]);

  const fetchSpecificAccount = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch specific user details
      const accountResponse = await axios.get(`${BASE_URL}/petty-cash-admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const account = accountResponse.data.data || accountResponse.data.account || accountResponse.data;
      setSelectedAccount(account);
      setAccounts([account]); // Set as single account array for consistency
      
      // Fetch transactions for this specific user
      await fetchTransactions(id);
    } catch (error) {
      console.error('Error fetching specific user:', error);
      toast.error('Failed to fetch user details');
      navigate('/dashboard/petty-cash'); // Redirect back if user not found
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAccounts(response.data.users || []);
      if (response.data.users && response.data.users.length > 0) {
        setSelectedAccount(response.data.users[0]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      setTransactionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users/${userId}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const transactions = response.data.transactions || [];
      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setTransactionLoading(false);
    }
  };

  const getAccountStatusColor = (balance) => {
    if (balance > 200) return 'text-gray-800';
    if (balance > 50) return 'text-gray-600';
    return 'text-gray-500';
  };

  const getAccountStatusIcon = (balance) => {
    if (balance > 200) return <FaCheckCircle className="h-3 w-3 text-gray-600" />;
    if (balance > 50) return <FaExclamationTriangle className="h-3 w-3 text-gray-500" />;
    return <FaExclamationTriangle className="h-3 w-3 text-gray-400" />;
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'replenishment':
        return 'text-green-700 bg-green-100';
      case 'expense':
        return 'text-red-700 bg-red-100';
      case 'transfer':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'replenishment':
        return <FaDollarSign className="h-3 w-3" />;
      case 'expense':
        return <FaFileAlt className="h-3 w-3" />;
      case 'transfer':
        return <FaCalendarAlt className="h-3 w-3" />;
      default:
        return <FaFileAlt className="h-3 w-3" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at || transaction.date);
    const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
    const endDate = dateFilter.end ? new Date(dateFilter.end) : null;

    if (startDate && transactionDate < startDate) return false;
    if (endDate && transactionDate > endDate) return false;
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleIssueCash = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const issuanceData = {
        amount: parseFloat(issueCashForm.amount),
        purpose: issueCashForm.purpose,
        reference_number: issueCashForm.reference_number,
        notes: issueCashForm.notes
      };
      
      const response = await axios.post(
        `${BASE_URL}/petty-cash-admin/users/${selectedAccount.id}/issue-cash`,
        issuanceData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Cash issued successfully');
        setShowIssueCashModal(false);
        setIssueCashForm({
          amount: '',
          purpose: '',
          reference_number: '',
          notes: ''
        });
        
        // Refresh account data and transactions
        if (accountId) {
          fetchSpecificAccount(accountId);
        } else {
          fetchAccounts();
          fetchTransactions(selectedAccount.id);
        }
      }
    } catch (error) {
      console.error('Error issuing cash:', error);
      toast.error(error.response?.data?.message || 'Failed to issue cash');
    }
  };

  const handleReduceCash = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const reductionData = {
        amount: parseFloat(reduceCashForm.amount),
        purpose: reduceCashForm.purpose,
        reference_number: reduceCashForm.reference_number,
        notes: reduceCashForm.notes
      };
      
      const response = await axios.post(
        `${BASE_URL}/petty-cash-admin/users/${selectedAccount.id}/reduce-cash`,
        reductionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Cash reduced successfully');
        setShowReduceCashModal(false);
        setReduceCashForm({
          amount: '',
          purpose: '',
          reference_number: '',
          notes: ''
        });
        
        // Refresh account data and transactions
        if (accountId) {
          fetchSpecificAccount(accountId);
        } else {
          fetchAccounts();
          fetchTransactions(selectedAccount.id);
        }
      }
    } catch (error) {
      console.error('Error reducing cash:', error);
      toast.error(error.response?.data?.message || 'Failed to reduce cash');
    }
  };

  const exportReconciliation = () => {
    if (!selectedAccount) return;
    
    // Create CSV content
    const csvContent = [
      ['User Reconciliation Report'],
      ['User Name:', selectedAccount.full_name || selectedAccount.username],
      ['Username:', selectedAccount.username],
      ['Email:', selectedAccount.email],
      ['Current Balance:', `$${parseFloat(selectedAccount.current_balance || 0).toFixed(2)}`],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Date', 'Type', 'Description', 'Amount', 'Balance', 'Reference']
    ];

    transactions.forEach(transaction => {
      csvContent.push([
        formatDate(transaction.created_at),
        transaction.transaction_type,
        transaction.description || transaction.purpose || '',
        `$${parseFloat(transaction.amount || 0).toFixed(2)}`,
        `$${parseFloat(transaction.balance_after || 0).toFixed(2)}`,
        transaction.reference_number || ''
      ]);
    });

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petty-cash-reconciliation-${selectedAccount.username}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-800 mb-1">
            {accountId ? `User Reconciliation - ${selectedAccount?.full_name || selectedAccount?.username || 'Loading...'}` : 'Petty Cash Reconciliation'}
          </h1>
          <p className="text-xs text-gray-500">
            {accountId ? 'Review user balance and transaction history' : 'Review user balances and transaction history'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReconciliation}
            disabled={!selectedAccount}
            className="bg-gray-600 text-white px-3 py-1 text-xs hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaDownload className="h-3 w-3" />
            Export Report
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${accountId ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        {/* Users List - Only show when not viewing specific user */}
        {!accountId && (
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-3">
              <h2 className="text-sm font-medium text-gray-800 mb-3">Petty Cash Users</h2>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`p-2 border cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <h3 className="text-xs font-medium text-gray-800">{account.full_name || account.username}</h3>
                          {getAccountStatusIcon(parseFloat(account.current_balance || 0))}
                        </div>
                        <p className="text-xs text-gray-500">Email: {account.email}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${getAccountStatusColor(parseFloat(account.current_balance || 0))}`}>
                          ${parseFloat(account.current_balance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaUser className="h-3 w-3" />
                      {account.username}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Details and Transactions */}
        <div className={accountId ? 'lg:col-span-1' : 'lg:col-span-2'}>
          {selectedAccount ? (
            <div className="space-y-6">
              {/* User Summary */}
              <div className="bg-white border border-gray-200 p-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-medium text-gray-800">{selectedAccount.full_name || selectedAccount.username}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowIssueCashModal(true)}
                      className="bg-green-600 text-white px-3 py-1 text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <FaDollarSign className="h-3 w-3" />
                      Issue Cash
                    </button>
                    <button
                      onClick={() => setShowReduceCashModal(true)}
                      className="bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <FaDollarSign className="h-3 w-3" />
                      Reduce Cash
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50">
                    <FaDollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                    <p className={`text-sm font-medium ${getAccountStatusColor(parseFloat(selectedAccount.current_balance || 0))}`}>
                      ${parseFloat(selectedAccount.current_balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50">
                    <FaFileAlt className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Username</p>
                    <p className="text-sm font-medium text-gray-800">{selectedAccount.username}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50">
                    <FaUser className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-800">{selectedAccount.email}</p>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white border border-gray-200 p-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-800">Transaction History</h3>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="border border-gray-300 px-2 py-1 text-xs"
                    />
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="border border-gray-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Type</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Description</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-800">
                            {new Date(transaction.created_at || transaction.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                              {getTransactionTypeIcon(transaction.transaction_type)}
                              <span className="capitalize">
                                {transaction.transaction_type === 'replenishment' ? 'replenishment' : 
                                 transaction.transaction_type === 'expense' ? 'expense' : 
                                 transaction.transaction_type || 'Unknown'}
                              </span>
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-800">{transaction.description || transaction.purpose || '-'}</td>
                          <td className={`py-2 px-2 text-right font-medium ${transaction.transaction_type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                            {(() => {
                              // Determine transaction type
                              const isExpense = transaction.transaction_type === 'expense';
                              
                              // Get the amount from the transaction
                              const amount = parseFloat(transaction.amount || 0);
                              
                              return `${isExpense ? '-' : '+'}$${amount.toFixed(2)}`;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <FaFileAlt className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-xs">No transactions found for the selected period</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-6 text-center">
              <FaFileAlt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-800 mb-1">No User Selected</h3>
              <p className="text-xs text-gray-500">Select a user from the list to view reconciliation details</p>
            </div>
          )}
        </div>
      </div>

      {/* Issue Cash Modal */}
      {showIssueCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Issue Cash</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleIssueCash(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueCashForm.amount}
                    onChange={(e) => setIssueCashForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    type="text"
                    value={issueCashForm.purpose}
                    onChange={(e) => setIssueCashForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cash replenishment"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={issueCashForm.reference_number}
                    onChange={(e) => setIssueCashForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={issueCashForm.notes}
                    onChange={(e) => setIssueCashForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowIssueCashModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Issue Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reduce Cash Modal */}
      {showReduceCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Reduce Cash</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleReduceCash(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={reduceCashForm.amount}
                    onChange={(e) => setReduceCashForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    type="text"
                    value={reduceCashForm.purpose}
                    onChange={(e) => setReduceCashForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cash return, Adjustment"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={reduceCashForm.reference_number}
                    onChange={(e) => setReduceCashForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={reduceCashForm.notes}
                    onChange={(e) => setReduceCashForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReduceCashModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reduce Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashReconciliation;