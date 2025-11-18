import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const IncomeStatement = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showIncomeStatement, setShowIncomeStatement] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

  // Generate list of all months for the selected year
  const getAllMonths = () => {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const date = new Date(selectedYear, month - 1, 1);
      months.push({
        year: selectedYear,
        month: month,
        label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        key: `${selectedYear}-${month.toString().padStart(2, '0')}`
      });
    }
    return months;
  };

  const handleMonthToggle = (monthKey) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthKey)) {
        return prev.filter(key => key !== monthKey);
      } else {
        return [...prev, monthKey];
      }
    });
  };

  const handleSelectAll = () => {
    const allMonths = getAllMonths();
    if (selectedMonths.length === allMonths.length) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(allMonths.map(m => m.key));
    }
  };

  const fetchIncomeStatementData = async () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month');
      return;
    }

    setLoading(true);
    setShowIncomeStatement(false);
    
    try {
      const allMonths = getAllMonths();
      const monthsToFetch = allMonths.filter(m => selectedMonths.includes(m.key));

      // Fetch data for each selected month in parallel
      const promises = monthsToFetch.map(async (monthInfo) => {
        const year = monthInfo.year;
        const month = monthInfo.month;
        const dateStart = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const dateEnd = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const params = new URLSearchParams({
          isConsolidated: 'true',
          startDate: dateStart,
          endDate: dateEnd
        });

        try {
          const response = await axios.get(`${BASE_URL}/income-statement/generate?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const data = response.data?.data || response.data || {};
          
          // Get all revenue accounts
          const revenueAccounts = data.revenue?.accounts || data.revenue || [];
          const revenueTotal = data.revenue?.total || revenueAccounts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
          
          // Get all expense accounts
          const expenseAccounts = data.expenses?.accounts || data.expenses || [];
          const expensesTotal = data.expenses?.total || expenseAccounts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
          
          const netProfit = revenueTotal - expensesTotal;

          return {
            month: monthInfo.label,
            year: year,
            monthNum: month,
            revenueAccounts: revenueAccounts.map(acc => ({
              account_id: acc.account_id,
              account_name: acc.account_name || acc.description || acc.name || 'Revenue',
              account_code: acc.account_code,
              amount: parseFloat(acc.amount) || 0
            })),
            expenseAccounts: expenseAccounts.map(acc => ({
              account_id: acc.account_id,
              account_name: acc.account_name || acc.description || acc.name || 'Expense',
              account_code: acc.account_code,
              amount: parseFloat(acc.amount) || 0
            })),
            revenueTotal: parseFloat(revenueTotal) || 0,
            expensesTotal: parseFloat(expensesTotal) || 0,
            netProfit: parseFloat(netProfit) || 0
          };
        } catch (error) {
          console.error(`Error fetching data for ${monthInfo.label}:`, error);
          return {
            month: monthInfo.label,
            year: year,
            monthNum: month,
            revenueAccounts: [],
            expenseAccounts: [],
            revenueTotal: 0,
            expensesTotal: 0,
            netProfit: 0
          };
        }
      });

      const results = await Promise.all(promises);
      setMonthlyData(results);
      setShowIncomeStatement(true);
    } catch (error) {
      console.error('Error fetching income statement:', error);
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

  const calculateTotals = () => {
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenueTotal, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expensesTotal, 0);
    const totalNetProfit = monthlyData.reduce((sum, month) => sum + month.netProfit, 0);
    
    return { totalRevenue, totalExpenses, totalNetProfit };
  };

  // Get all unique revenue accounts across all months
  const getAllRevenueAccounts = () => {
    const accountMap = new Map();
    monthlyData.forEach(month => {
      month.revenueAccounts?.forEach(acc => {
        const key = acc.account_id || acc.account_code || acc.account_name;
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            account_id: acc.account_id,
            account_name: acc.account_name,
            account_code: acc.account_code
          });
        }
      });
    });
    return Array.from(accountMap.values());
  };

  // Get all unique expense accounts across all months
  const getAllExpenseAccounts = () => {
    const accountMap = new Map();
    monthlyData.forEach(month => {
      month.expenseAccounts?.forEach(acc => {
        const key = acc.account_id || acc.account_code || acc.account_name;
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            account_id: acc.account_id,
            account_name: acc.account_name,
            account_code: acc.account_code
          });
        }
      });
    });
    return Array.from(accountMap.values());
  };

  // Get amount for a specific account in a specific month
  const getAccountAmount = (accountId, accountCode, accountName, monthData, isRevenue) => {
    const accounts = isRevenue ? monthData.revenueAccounts : monthData.expenseAccounts;
    const account = accounts?.find(acc => 
      (accountId && acc.account_id === accountId) ||
      (accountCode && acc.account_code === accountCode) ||
      (accountName && acc.account_name === accountName)
    );
    return account ? parseFloat(account.amount) || 0 : 0;
  };

  const totals = calculateTotals();
  const allRevenueAccounts = getAllRevenueAccounts();
  const allExpenseAccounts = getAllExpenseAccounts();

  // Prepare chart data
  const chartData = monthlyData.map(month => ({
    month: month.month,
    revenue: month.revenueTotal,
    expenses: month.expensesTotal,
    netProfit: month.netProfit
  }));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Income Statement</h1>
          <p className="mt-0.5 text-xs text-gray-500">View financial performance for a specific period</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 border border-gray-200">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setSelectedMonths([]); // Clear selections when year changes
                  }}
                  className="w-full text-xs border border-gray-300 px-2 py-1"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSelectAll}
                  className="w-full bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-4 hover:bg-gray-300"
                >
                  {selectedMonths.length === getAllMonths().length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Month Checkboxes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Select Months</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {getAllMonths().map((monthInfo) => (
                  <label
                    key={monthInfo.key}
                    className="flex items-center space-x-1 cursor-pointer p-1 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(monthInfo.key)}
                      onChange={() => handleMonthToggle(monthInfo.key)}
                      className="w-3 h-3 text-[#f58020] border-gray-300 focus:ring-[#f58020]"
                    />
                    <span className="text-xs text-gray-700">{monthInfo.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchIncomeStatementData}
                disabled={loading || selectedMonths.length === 0}
                className="flex-1 bg-[#f58020] text-white text-xs font-medium py-1.5 px-4 hover:bg-[#e6701a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {showIncomeStatement && monthlyData.length > 0 && (
                <div className="flex gap-1 border border-gray-300">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      viewMode === 'table'
                        ? 'bg-[#f58020] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      viewMode === 'chart'
                        ? 'bg-[#f58020] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Chart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Income Statement View */}
        {showIncomeStatement && monthlyData.length > 0 && (
          <div className="bg-white border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Income Statement - {selectedYear}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Selected: {monthlyData.map(m => m.month).join(', ')}
              </p>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    {monthlyData.map((month, index) => (
                      <th key={index} className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {month.month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Revenue Section Header */}
                  <tr className="bg-green-50">
                    <td colSpan={monthlyData.length + 1} className="px-3 py-2 text-xs font-bold text-gray-900">
                      REVENUE
                    </td>
                  </tr>

                  {/* Revenue Accounts */}
                  {allRevenueAccounts.length > 0 ? (
                    allRevenueAccounts.map((account, accIndex) => (
                      <tr key={`revenue-${account.account_id || account.account_code || accIndex}`}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-600 pl-6">
                          {account.account_name}
                        </td>
                        {monthlyData.map((month, monthIndex) => {
                          const amount = getAccountAmount(account.account_id, account.account_code, account.account_name, month, true);
                          return (
                            <td key={monthIndex} className="px-3 py-1.5 whitespace-nowrap text-xs text-right text-green-600">
                              {amount > 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={monthlyData.length + 1} className="px-3 py-2 text-xs text-gray-500 text-center">
                        No revenue data
                      </td>
                    </tr>
                  )}

                  {/* Total Revenue */}
                  <tr className="bg-green-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                      Total Revenue
                    </td>
                    {monthlyData.map((month, index) => (
                      <td key={index} className="px-3 py-2 whitespace-nowrap text-xs text-right text-green-600 font-bold">
                        {formatCurrency(month.revenueTotal)}
                      </td>
                    ))}
                  </tr>

                  {/* Expenses Section Header */}
                  <tr className="bg-red-50">
                    <td colSpan={monthlyData.length + 1} className="px-3 py-2 text-xs font-bold text-gray-900">
                      EXPENSES
                    </td>
                  </tr>

                  {/* Expense Accounts */}
                  {allExpenseAccounts.length > 0 ? (
                    allExpenseAccounts.map((account, accIndex) => (
                      <tr key={`expense-${account.account_id || account.account_code || accIndex}`}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-600 pl-6">
                          {account.account_name}
                        </td>
                        {monthlyData.map((month, monthIndex) => {
                          const amount = getAccountAmount(account.account_id, account.account_code, account.account_name, month, false);
                          return (
                            <td key={monthIndex} className="px-3 py-1.5 whitespace-nowrap text-xs text-right text-red-600">
                              {amount > 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={monthlyData.length + 1} className="px-3 py-2 text-xs text-gray-500 text-center">
                        No expense data
                      </td>
                    </tr>
                  )}

                  {/* Total Expenses */}
                  <tr className="bg-red-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                      Total Expenses
                    </td>
                    {monthlyData.map((month, index) => (
                      <td key={index} className="px-3 py-2 whitespace-nowrap text-xs text-right text-red-600 font-bold">
                        {formatCurrency(month.expensesTotal)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Profit Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                      Net Profit
                    </td>
                    {monthlyData.map((month, index) => (
                      <td key={index} className={`px-3 py-2 whitespace-nowrap text-xs text-right font-bold ${month.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month.netProfit)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            ) : (
              <div className="p-3">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Revenue vs Expenses</h3>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-50 p-3 border border-green-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-base font-bold text-green-600">
                      {formatCurrency(totals.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 border border-red-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-base font-bold text-red-600">
                      {formatCurrency(totals.totalExpenses)}
                    </p>
                  </div>
                  <div className={`p-3 border ${totals.totalNetProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs font-medium text-gray-600 mb-1">Net Profit</p>
                    <p className={`text-base font-bold ${totals.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.totalNetProfit)}
                    </p>
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

export default IncomeStatement;

