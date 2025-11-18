import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const PettyCashTransactions = () => {
  const { accountId, userId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchAccountAndTransactions();
    }
  }, [accountId, userId, token]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, dateFilter, transactionTypeFilter]);

  const fetchAccountAndTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch account details and transactions
      if (accountId) {
        const accountResponse = await axios.get(`${BASE_URL}/petty-cash-admin/accounts/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const accountData = accountResponse.data.account || accountResponse.data;
        setAccount(accountData);
        
        // If account has transactions, set them
        if (accountData.transactions) {
          setTransactions(accountData.transactions);
        }
      } else if (userId) {
        // Try to get boarding house ID from petty cash users list first
        let boardingHouseId = null;
        
        try {
          // Try to fetch petty cash users to find this user's boarding house
          const usersResponse = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const users = usersResponse.data?.users || usersResponse.data || [];
          const userAccount = users.find(u => u.id === parseInt(userId) || u.petty_cash_user_id === parseInt(userId));
          if (userAccount) {
            boardingHouseId = userAccount.boarding_house_id;
          }
        } catch (err) {
          console.log('Could not fetch petty cash users, trying user endpoint');
          
          // Fallback: try to fetch user info
          try {
            const userResponse = await axios.get(`${BASE_URL}/users/${userId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            boardingHouseId = userResponse.data?.boarding_house_id;
          } catch (userErr) {
            console.log('Could not fetch user info either');
          }
        }
        
        // Prepare headers
        const headers = {
          'Authorization': `Bearer ${token}`,
          'user-id': userId
        };
        
        // Add boarding house ID if available
        if (boardingHouseId) {
          headers['boarding-house-id'] = boardingHouseId;
        }
        
        // Fetch by user ID
        const accountResponse = await axios.get(`${BASE_URL}/petty-cash/account`, {
          headers: headers
        });
        
        if (accountResponse.data && accountResponse.data.success !== false) {
          setAccount(accountResponse.data);
          setTransactions(accountResponse.data.transactions || []);
        } else {
          throw new Error(accountResponse.data?.message || 'Failed to fetch account');
        }
      }
    } catch (error) {
      console.error('Error fetching account and transactions:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load transactions';
      toast.error(errorMessage);
      
      // Set empty state on error
      setAccount(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by date range
    if (dateFilter.start) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.transaction_date || t.created_at);
        return transactionDate >= new Date(dateFilter.start);
      });
    }

    if (dateFilter.end) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.transaction_date || t.created_at);
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        return transactionDate <= endDate;
      });
    }

    // Filter by transaction type
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (transactionTypeFilter === 'inflow') {
          return t.transaction_type === 'cash_inflow' || t.transaction_type === 'student_payment';
        } else if (transactionTypeFilter === 'outflow') {
          return t.transaction_type === 'cash_outflow' || t.transaction_type === 'expense';
        }
        return t.transaction_type === transactionTypeFilter;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.transaction_date || a.created_at);
      const dateB = new Date(b.transaction_date || b.created_at);
      return dateB - dateA;
    });

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'cash_inflow': 'Cash Inflow',
      'cash_outflow': 'Cash Outflow',
      'student_payment': 'Student Payment',
      'expense': 'Expense',
      'beginning_balance': 'Beginning Balance',
      'replenishment': 'Replenishment'
    };
    return labels[type] || type;
  };

  const calculateTotalInflow = () => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'cash_inflow' || t.transaction_type === 'student_payment')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const calculateTotalOutflow = () => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'cash_outflow' || t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58020]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/petty-cash')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Petty Cash
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Petty Cash Transactions</h1>
            {account && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Account: <span className="font-medium text-gray-700">{account.account_name || account.username || 'Unknown'}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Code: <span className="font-medium text-gray-700">{account.account_code || 'N/A'}</span>
                </p>
              </div>
            )}
          </div>
          {account && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${
                parseFloat(account.current_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(account.current_balance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Filters</h2>
          {(dateFilter.start || dateFilter.end || transactionTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setDateFilter({ start: '', end: '' });
                setTransactionTypeFilter('all');
              }}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              >
                <option value="all">All Types</option>
                <option value="inflow">Inflows</option>
                <option value="outflow">Outflows</option>
                <option value="cash_inflow">Cash Inflow</option>
                <option value="cash_outflow">Cash Outflow</option>
                <option value="student_payment">Student Payment</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-600 mb-1">Total Inflow</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(calculateTotalInflow())}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-600 mb-1">Total Outflow</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(calculateTotalOutflow())}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
              <p className="text-lg font-semibold text-gray-900">{filteredTransactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(transaction.transaction_date || transaction.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 max-w-xs truncate">
                      {transaction.description || transaction.notes || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {transaction.reference_number || '-'}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-xs font-semibold text-right ${
                      transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment'
                        ? `+${formatCurrency(transaction.amount)}`
                        : `-${formatCurrency(transaction.amount)}`
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                      {formatCurrency(transaction.running_balance || transaction.balance || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No transactions found</p>
                    {(dateFilter.start || dateFilter.end || transactionTypeFilter !== 'all') && (
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PettyCashTransactions;

