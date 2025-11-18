import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ExpensesReport = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Generate month options
  const months = [
    { value: 1, label: 'January', short: 'Jan' },
    { value: 2, label: 'February', short: 'Feb' },
    { value: 3, label: 'March', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'May', short: 'May' },
    { value: 6, label: 'June', short: 'Jun' },
    { value: 7, label: 'July', short: 'Jul' },
    { value: 8, label: 'August', short: 'Aug' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'October', short: 'Oct' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'December', short: 'Dec' }
  ];

  useEffect(() => {
    if (selectedMonths.length > 0) {
      fetchExpensesReport();
    }
  }, [selectedYear, selectedMonths]);

  const toggleMonth = (monthValue) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthValue)) {
        return prev.filter(m => m !== monthValue);
      } else {
        return [...prev, monthValue].sort((a, b) => a - b);
      }
    });
  };

  const toggleAllMonths = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(months.map(m => m.value));
    }
  };

  const fetchExpensesReport = async () => {
    if (selectedMonths.length === 0) {
      setError('Please select at least one month');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch data for all selected months in parallel
      const monthPromises = selectedMonths.map(month => {
        const params = {
          month: month,
          year: selectedYear
        };
        return axios.get(`${BASE_URL}/expenses/report/expenses`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params
        });
      });

      const responses = await Promise.all(monthPromises);
      
      // Process the data
      const monthlyData = {};
      const allExpenses = [];
      const expenseByAccount = {};
      const expenseFrequency = {};

      responses.forEach((response, index) => {
        const month = selectedMonths[index];
        const monthName = months.find(m => m.value === month)?.short || month;
        const data = response.data;

        // Ensure numeric conversion
        const totalAmount = Number(data.summary?.total_amount) || 0;
        const totalTransactions = Number(data.summary?.total_transactions) || 0;

        monthlyData[month] = {
          month,
          monthName,
          totalAmount,
          totalTransactions,
          boardingHouses: data.boarding_houses || []
        };

        // Aggregate all expenses
        data.boarding_houses?.forEach(bh => {
          bh.accounts?.forEach(account => {
            const key = `${account.account_code}-${account.account_name}`;
            
            // Ensure numeric conversion for account amounts
            const accountAmount = Number(account.total_amount) || 0;
            const accountCount = Number(account.transaction_count) || 0;
            
            // For monthly totals
            if (!expenseByAccount[key]) {
              expenseByAccount[key] = {
                account_code: account.account_code,
                account_name: account.account_name,
                months: {}
              };
            }
            expenseByAccount[key].months[month] = accountAmount;

            // For frequency tracking
            if (!expenseFrequency[key]) {
              expenseFrequency[key] = {
                account_code: account.account_code,
                account_name: account.account_name,
                count: 0,
                totalAmount: 0
              };
            }
            expenseFrequency[key].count += accountCount;
            expenseFrequency[key].totalAmount += accountAmount;
          });
        });
      });

      // Calculate totals for each account
      Object.keys(expenseByAccount).forEach(key => {
        expenseByAccount[key].total = Object.values(expenseByAccount[key].months).reduce((sum, val) => {
          const numVal = Number(val) || 0;
          return sum + numVal;
        }, 0);
      });

      // Recalculate monthly totals from actual expense data
      Object.keys(monthlyData).forEach(month => {
        let monthTotal = 0;
        Object.values(expenseByAccount).forEach(account => {
          const monthAmount = Number(account.months[month]) || 0;
          monthTotal += monthAmount;
        });
        monthlyData[month].totalAmount = monthTotal;
      });

      // Get top expenses by amount
      const topExpensesByAmount = Object.values(expenseByAccount)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Get top expenses by frequency
      const topExpensesByFrequency = Object.values(expenseFrequency)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate overall metrics - use actual expense data instead of API summary
      // Total expenses from all accounts across all months
      const totalExpenses = Object.values(expenseByAccount).reduce((sum, account) => {
        return sum + (Number(account.total) || 0);
      }, 0);
      
      // Total transactions from frequency data
      const totalTransactions = Object.values(expenseFrequency).reduce((sum, expense) => {
        return sum + (Number(expense.count) || 0);
      }, 0);
      
      // Average expense per transaction
      const averageExpense = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;

      setReportData({
        monthlyData,
        topExpensesByAmount,
        topExpensesByFrequency,
        metrics: {
          totalExpenses,
          totalTransactions,
          averageExpense,
          monthCount: selectedMonths.length
        }
      });
    } catch (error) {
      console.error('Error fetching expenses report:', error);
      setError(error.response?.data?.message || 'Failed to fetch expenses report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Prepare chart data - calculate from reportData when available
  const chartData = reportData ? selectedMonths
    .sort((a, b) => a - b)
    .map(month => {
      const data = reportData.monthlyData[month];
      const amount = Number(data?.totalAmount) || 0;
      return {
        month: months.find(m => m.value === month)?.short || month,
        amount: amount
      };
    }) : [];

  // Prepare pie chart data for top expenses
  const pieChartData = reportData?.topExpensesByAmount.slice(0, 5).map(expense => ({
    name: expense.account_name,
    value: expense.total
  })) || [];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Expenses Report</h1>
          <p className="mt-0.5 text-xs text-gray-500">View expenses over months, most expensive and frequent expenses</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 px-2 py-1"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={toggleAllMonths}
                className="w-full text-xs bg-gray-100 text-gray-700 py-1.5 px-4 hover:bg-gray-200"
              >
                {selectedMonths.length === 12 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Months</label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {months.map(month => (
                <label key={month.value} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month.value)}
                    onChange={() => toggleMonth(month.value)}
                    className="text-xs"
                  />
                  <span className="text-xs text-gray-700">{month.short}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchExpensesReport}
              disabled={loading || selectedMonths.length === 0}
              className="text-xs bg-[#f58020] text-white py-1.5 px-4 hover:bg-[#e6701a] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            {reportData && (
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                className="text-xs bg-gray-100 text-gray-700 py-1.5 px-4 hover:bg-gray-200"
              >
                {viewMode === 'table' ? 'View Chart' : 'View Table'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {reportData && (
          <div className="space-y-3">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(reportData.metrics.totalExpenses)}</p>
              </div>
              <div className="bg-white border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
                <p className="text-base font-bold text-gray-900">{reportData.metrics.totalTransactions}</p>
              </div>
              <div className="bg-white border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Average Expense</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(reportData.metrics.averageExpense)}</p>
              </div>
              <div className="bg-white border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Months Selected</p>
                <p className="text-base font-bold text-gray-900">{reportData.metrics.monthCount}</p>
              </div>
            </div>

            {/* Monthly Expenses Chart */}
            {viewMode === 'chart' && chartData.length > 0 && (
              <div className="bg-white border border-gray-200 p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Expenses Over Months</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="amount" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Expenses by Amount */}
            <div className="bg-white border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Top 10 Most Expensive Expenses</h3>
              </div>
              <div className="p-3">
                {viewMode === 'chart' && (
                  <div className="mb-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-700">Account Code</th>
                        <th className="text-left py-2 font-medium text-gray-700">Account Name</th>
                        {selectedMonths.sort((a, b) => a - b).map(month => (
                          <th key={month} className="text-right py-2 font-medium text-gray-700">
                            {months.find(m => m.value === month)?.short}
                          </th>
                        ))}
                        <th className="text-right py-2 font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topExpensesByAmount.map((expense, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-900">{expense.account_code}</td>
                          <td className="py-2 text-gray-900">{expense.account_name}</td>
                          {selectedMonths.sort((a, b) => a - b).map(month => (
                            <td key={month} className="py-2 text-gray-900 text-right">
                              {formatCurrency(expense.months[month] || 0)}
                            </td>
                          ))}
                          <td className="py-2 text-gray-900 font-medium text-right">
                            {formatCurrency(expense.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Expenses by Frequency */}
            <div className="bg-white border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Top 10 Most Frequent Expenses</h3>
              </div>
              <div className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-700">Account Code</th>
                        <th className="text-left py-2 font-medium text-gray-700">Account Name</th>
                        <th className="text-right py-2 font-medium text-gray-700">Transaction Count</th>
                        <th className="text-right py-2 font-medium text-gray-700">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topExpensesByFrequency.map((expense, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-900">{expense.account_code}</td>
                          <td className="py-2 text-gray-900">{expense.account_name}</td>
                          <td className="py-2 text-gray-900 text-right">{expense.count}</td>
                          <td className="py-2 text-gray-900 text-right">{formatCurrency(expense.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            {viewMode === 'table' && (
              <div className="bg-white border border-gray-200">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Breakdown</h3>
                </div>
                <div className="p-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">Month</th>
                          <th className="text-right py-2 font-medium text-gray-700">Total Amount</th>
                          <th className="text-right py-2 font-medium text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMonths.sort((a, b) => a - b).map(month => {
                          const data = reportData.monthlyData[month];
                          return (
                            <tr key={month} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">
                                {months.find(m => m.value === month)?.label} {selectedYear}
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {formatCurrency(data?.totalAmount || 0)}
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {data?.totalTransactions || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpensesReport;

