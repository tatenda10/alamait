import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const BalanceBDCD = () => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');

  // Fetch balance periods
  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/balance/periods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPeriods(response.data);
      
      // Set default selection to current year and month
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth.toString().padStart(2, '0'));
      
      // Find the period for current year and month
      const currentPeriod = response.data.find(p => {
        const periodYear = new Date(p.period_start_date).getFullYear();
        const periodMonth = new Date(p.period_start_date).getMonth() + 1;
        return periodYear === currentYear && periodMonth === currentMonth;
      });
      
      if (currentPeriod) {
        setSelectedPeriod(currentPeriod.id);
      } else if (response.data.length > 0) {
        setSelectedPeriod(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      setError('Failed to load balance periods');
    }
  };

  // Fetch account balances for selected period
  const fetchBalances = async () => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${BASE_URL}/balance/periods/${selectedPeriod}/balances`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBalances(response.data);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError('Failed to load account balances');
    } finally {
      setLoading(false);
    }
  };

  // Set balance brought down
  const setBalanceBroughtDown = async (accountId, balance) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/balance/accounts/${accountId}/periods/${selectedPeriod}/bd`,
        { balance_brought_down: balance },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Balance brought down updated successfully');
      fetchBalances(); // Refresh the data
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error setting balance brought down:', error);
      setError('Failed to update balance brought down');
    }
  };

  // Close period
  const closePeriod = async () => {
    if (!window.confirm('Are you sure you want to close this period? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/balance/periods/${selectedPeriod}/close`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSuccess(`Period closed successfully. Balances carried forward to next period.`);
      fetchPeriods(); // Refresh periods
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error closing period:', error);
      setError('Failed to close period');
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchBalances();
    }
  }, [selectedPeriod]);

  // Update selected period when year or month changes
  useEffect(() => {
    if (selectedYear && selectedMonth && periods.length > 0) {
      const targetPeriod = periods.find(p => {
        const periodYear = new Date(p.period_start_date).getFullYear();
        const periodMonth = new Date(p.period_start_date).getMonth() + 1;
        return periodYear === parseInt(selectedYear) && periodMonth === parseInt(selectedMonth);
      });
      
      if (targetPeriod) {
        setSelectedPeriod(targetPeriod.id);
      }
    }
  }, [selectedYear, selectedMonth, periods]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'Asset': return 'text-blue-600';
      case 'Liability': return 'text-red-600';
      case 'Equity': return 'text-green-600';
      case 'Revenue': return 'text-purple-600';
      case 'Expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  // Get available years and months from periods
  const availableYears = [...new Set(periods.map(p => new Date(p.period_start_date).getFullYear()))].sort();
  const availableMonths = periods
    .filter(p => new Date(p.period_start_date).getFullYear() === parseInt(selectedYear))
    .map(p => ({
      value: (new Date(p.period_start_date).getMonth() + 1).toString().padStart(2, '0'),
      label: new Date(p.period_start_date).toLocaleDateString('en-US', { month: 'long' })
    }))
    .sort((a, b) => parseInt(a.value) - parseInt(b.value));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Balance BD/CD Management</h1>
              <p className="text-xs text-gray-500">Manage Balance Brought Down and Carried Down</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Year Selection */}
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Month Selection */}
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                >
                  <option value="">Select Month</option>
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {currentPeriod && !currentPeriod.is_closed && (
                <button
                  onClick={closePeriod}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  Close Period
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200">
            <div className="flex">
              <FiAlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200">
            <div className="flex">
              <FiCheckCircle className="h-4 w-4 text-green-400 mr-2" />
              <p className="text-xs text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Period Info */}
        {currentPeriod && (
          <div className="mb-4 p-3 bg-white border border-gray-200">
            <div className="flex items-center space-x-3">
              <FiCalendar className="h-4 w-4 text-gray-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">{currentPeriod.period_name}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(currentPeriod.period_start_date).toLocaleDateString()} - {new Date(currentPeriod.period_end_date).toLocaleDateString()}
                </p>
              </div>
              {currentPeriod.is_closed && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium">
                  Closed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Balances Table */}
        <div className="bg-white shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium text-gray-900">Account Balances</h3>
              <button
                onClick={fetchBalances}
                disabled={loading}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#E78D69]"
              >
                <FiRefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E78D69] mx-auto"></div>
              <p className="mt-2 text-xs text-gray-500">Loading balances...</p>
            </div>
          ) : balances.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-xs">No balances found for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Brought Down (BD)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Debits
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Credits
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Carried Down (CD)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculated Balance
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balances.map((balance) => (
                    <tr key={balance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {balance.account_code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {balance.account_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(balance.account_type)}`}>
                          {balance.account_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-900">
                        {currentPeriod && !currentPeriod.is_closed ? (
                          <input
                            type="number"
                            value={balance.balance_brought_down || 0}
                            onChange={(e) => {
                              const newBalances = balances.map(b => 
                                b.id === balance.id 
                                  ? { ...b, balance_brought_down: parseFloat(e.target.value) || 0 }
                                  : b
                              );
                              setBalances(newBalances);
                            }}
                            onBlur={() => setBalanceBroughtDown(balance.account_id, balance.balance_brought_down)}
                            className="w-20 text-right border border-gray-300 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69]"
                            step="0.01"
                          />
                        ) : (
                          formatCurrency(balance.balance_brought_down)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-900">
                        {formatCurrency(balance.total_debits)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-900">
                        {formatCurrency(balance.total_credits)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-900">
                        {formatCurrency(balance.balance_carried_down)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-900">
                        {formatCurrency(balance.calculated_balance)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-medium">
                        <Link
                          to={`/dashboard/accounting/account-ledger/${balance.account_id}/${selectedPeriod}`}
                          className="text-[#E78D69] hover:text-[#E78D69]/80"
                        >
                          View Ledger
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceBDCD; 