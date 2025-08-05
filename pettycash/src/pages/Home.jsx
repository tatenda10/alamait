import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiClock, FiPlus, FiUser, FiRefreshCw, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { 
    user, 
    logout, 
    isAuthenticated, 
    canAccessPettyCash, 
    getBalance,
    getRecentTransactions,
    api
  } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    recentTransactions: [],
    pendingTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated() || !canAccessPettyCash()) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, canAccessPettyCash, navigate]);

  // Function to fetch pending transactions for the current user
  const getPendingTransactions = async () => {
    try {
      const response = await api.get(`/pending-petty-cash/users/${user.id}/pending-expenses`, {
        params: {
          status: 'pending',
          limit: 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      throw error;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data from API
      const [balanceRes, transactionsRes, pendingRes] = await Promise.all([
        getBalance(),
        getRecentTransactions(),
        getPendingTransactions()
      ]);

      setDashboardData({
        balance: balanceRes.balance || 0,
        recentTransactions: transactionsRes.transactions || [],
        pendingTransactions: pendingRes.data?.expenses || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'expense':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'replenishment':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 lg:py-0 lg:h-20 gap-4 lg:gap-0">
            <div className="flex items-center space-x-4">
           
              <div>
                <h1 className="t lg:text-2xl font-semibold text-slate-900 tracking-tight">
                  Petty Cash Dashboard
                </h1>
               
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 w-full lg:w-auto">
              <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50">
                <div className="w-6 h-6 bg-slate-200 flex items-center justify-center">
                  <FiUser className="h-3 w-3 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-slate-500">Petty Cash User</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
                  disabled={loading}
                >
                  <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                >
                  <FiLogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-8 bg-red-50 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error Loading Data</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <button 
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Current Balance</p>
                <p className="text-xl font-bold text-slate-900 mb-1">
                  {formatCurrency(dashboardData.balance)}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Available Funds</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <FiDollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Recent Transactions</p>
                <p className="text-xl font-bold text-slate-900 mb-1">
                  {dashboardData.recentTransactions.length}
                </p>
                <p className="text-xs text-blue-600 font-medium">Last 30 Days</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FiClock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Pending Expenses</p>
                <p className="text-xl font-bold text-slate-900 mb-1">
                  {dashboardData.pendingTransactions.length}
                </p>
                <p className="text-xs text-amber-600 font-medium">Awaiting Approval</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <FiAlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Quick Actions</p>
                <button 
                  onClick={() => navigate('/add-expense')}
                  className="mt-2 w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  New Transaction
                </button>
              </div>
            
            </div>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="bg-white shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pending Expenses</h2>
                <p className="text-xs text-slate-600 mt-1">Expenses awaiting approval</p>
              </div>
              <div className="w-8 h-8 bg-amber-100 flex items-center justify-center">
                <FiAlertCircle className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {dashboardData.pendingTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {dashboardData.pendingTransactions.map((expense) => (
                  <div key={expense.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 text-xs mb-1">{expense.description}</h3>
                        {expense.vendor_name && (
                          <p className="text-xs text-slate-500">Vendor: {expense.vendor_name}</p>
                        )}
                      </div>
                      <span className={`ml-4 inline-flex px-2 py-1 text-xs font-medium border ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Date:</span> {formatDate(expense.expense_date)}
                        </p>
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Submitted:</span> {formatDate(expense.submitted_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <FiAlertCircle className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">No pending expenses</h3>
                <p className="text-xs text-slate-500">
                  Your pending expenses will appear here once submitted
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                 <tr>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Date
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Description
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Vendor
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Amount
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Status
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Submitted
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {dashboardData.pendingTransactions.length > 0 ? (
                  dashboardData.pendingTransactions.map((expense) => (
                     <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-900 align-top text-start">
                         {formatDate(expense.expense_date)}
                       </td>
                       <td className="px-3 py-2 text-xs text-slate-900 align-top text-start">
                         <div className="max-w-xs">
                           <p className="font-medium text-start" title={expense.description}>
                             {expense.description}
                           </p>
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 align-top text-start">
                         {expense.vendor_name || 'N/A'}
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-red-600 align-top text-start">
                         {formatCurrency(expense.amount)}
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs align-top text-start">
                         <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getStatusColor(expense.status)}`}>
                           {expense.status}
                         </span>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 align-top text-start">
                         {formatDate(expense.submitted_at)}
                       </td>
                     </tr>
                   ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mb-3">
                          <FiAlertCircle className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-1">No pending expenses</h3>
                        <p className="text-xs text-slate-500">
                          Your pending expenses will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-600 mt-1">Your latest financial activities</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 flex items-center justify-center">
                <FiClock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-slate-50 p-3 border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 text-xs mb-1">
                        {transaction.description}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {transaction.vendor_name || 'No vendor specified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium">Amount</p>
                      <p className={`font-bold ${transaction.transaction_type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Date</p>
                      <p className="text-slate-900">{formatDate(transaction.transaction_date)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Boarding House</p>
                      <p className="text-slate-900">{transaction.boarding_house_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                        {transaction.status_text || transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <FiClock className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">No recent transactions</h3>
                <p className="text-xs text-slate-500">
                  Your transactions will appear here once you start making them
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                 <tr>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Date
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Description
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Boarding House
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Type
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Amount
                   </th>
                   <th className="px-3 py-2 text-left text-start text-xs font-medium text-slate-600 uppercase tracking-wide">
                     Status
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((transaction) => (
                     <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-900 align-top text-start">
                         {formatDate(transaction.transaction_date)}
                       </td>
                       <td className="px-3 py-2 text-xs text-slate-900 align-top text-start">
                         <div className="max-w-xs">
                           <p className="font-medium text-start" title={transaction.description}>
                             {transaction.description}
                           </p>
                           {transaction.vendor_name && (
                             <p className="text-xs text-slate-500 mt-1 text-start">
                               Vendor: {transaction.vendor_name}
                             </p>
                           )}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 align-top text-start">
                         {transaction.boarding_house_name || 'N/A'}
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs align-top text-start">
                         <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getTypeColor(transaction.transaction_type)}`}>
                           {transaction.transaction_type}
                         </span>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs font-bold align-top text-start">
                         <span className={transaction.transaction_type === 'expense' ? 'text-red-600' : 'text-emerald-600'}>
                           {transaction.transaction_type === 'expense' ? '-' : '+'}
                           {formatCurrency(transaction.amount)}
                         </span>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs align-top text-start">
                         <span className={`inline-flex px-2 py-1 text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                           {transaction.status_text || transaction.status}
                         </span>
                       </td>
                     </tr>
                   ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mb-3">
                          <FiClock className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-1">No recent transactions</h3>
                        <p className="text-xs text-slate-500">
                          Your transactions will appear here once you start making them
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;