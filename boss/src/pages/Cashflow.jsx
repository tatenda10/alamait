import React, { useState } from 'react';
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

const Cashflow = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cashflowData, setCashflowData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showCashflow, setShowCashflow] = useState(false);
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

  const fetchCashflowData = async () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month');
      return;
    }

    setLoading(true);
    setShowCashflow(false);
    
    try {
      const allMonths = getAllMonths();
      const monthsToFetch = allMonths.filter(m => selectedMonths.includes(m.key));
      
      // Get date range from first to last selected month
      const firstMonth = monthsToFetch[0];
      const lastMonth = monthsToFetch[monthsToFetch.length - 1];
      
      const dateStart = `${firstMonth.year}-${firstMonth.month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(lastMonth.year, lastMonth.month, 0).getDate();
      const dateEnd = `${lastMonth.year}-${lastMonth.month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const params = new URLSearchParams({
        start_date: dateStart,
        end_date: dateEnd,
        boarding_house_id: 'all'
      });

      const response = await axios.get(`${BASE_URL}/reports/cashflow/monthly?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data || {};
      
      // Transform the API response to match our display format
      const transformedData = monthsToFetch.map((monthInfo, index) => {
        const operating = data.operatingActivities || {};
        const income = operating.income || [];
        const expenses = operating.expenses || [];
        
        // Get values for this specific month
        const monthIncome = income.map(item => ({
          description: item.category,
          amount: item.monthlyValues?.[index] || 0
        }));
        
        const monthExpenses = expenses.map(item => ({
          description: item.category,
          amount: item.monthlyValues?.[index] || 0
        }));
        
        const totalIncome = monthIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = monthExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        
        return {
          month: monthInfo.label,
          year: monthInfo.year,
          monthNum: monthInfo.month,
          data: {
            operatingActivities: {
              income: monthIncome,
              expenses: monthExpenses
            },
            totalIncome,
            totalExpenses,
            netCashflow: totalIncome - totalExpenses
          }
        };
      });
      
      setCashflowData(transformedData);
      setShowCashflow(true);
    } catch (error) {
      console.error('Error fetching cashflow:', error);
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

  // Prepare chart data
  const chartData = cashflowData?.map(month => {
    const monthData = month.data || {};
    return {
      month: month.month,
      income: monthData.totalIncome || 0,
      expenses: monthData.totalExpenses || 0,
      netCashflow: monthData.netCashflow || 0
    };
  }) || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Cashflow Statement</h1>
          <p className="mt-0.5 text-xs text-gray-500">View cash inflows and outflows for a specific period</p>
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
                    setSelectedMonths([]);
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
                onClick={fetchCashflowData}
                disabled={loading || selectedMonths.length === 0}
                className="flex-1 bg-[#f58020] text-white text-xs font-medium py-1.5 px-4 hover:bg-[#e6701a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {showCashflow && cashflowData && cashflowData.length > 0 && (
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

        {/* Cashflow View */}
        {showCashflow && cashflowData && cashflowData.length > 0 && (
          <div className="bg-white border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Cashflow Statement - {selectedYear}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Selected: {cashflowData.map(m => m.month).join(', ')}
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
                      {cashflowData.map((month, index) => (
                        <th key={index} className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {month.month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Operating Activities - Income */}
                    <tr className="bg-green-50">
                      <td colSpan={cashflowData.length + 1} className="px-3 py-2 text-xs font-bold text-gray-900">
                        OPERATING ACTIVITIES - INCOME
                      </td>
                    </tr>
                    {cashflowData[0]?.data?.operatingActivities?.income?.map((item, itemIndex) => (
                      <tr key={`income-${itemIndex}`}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-600 pl-6">
                          {item.description || item.name || 'Income'}
                        </td>
                        {cashflowData.map((month, monthIndex) => {
                          const monthIncome = month.data?.operatingActivities?.income || [];
                          const amount = monthIncome[itemIndex]?.amount || 0;
                          return (
                            <td key={monthIndex} className="px-3 py-1.5 whitespace-nowrap text-xs text-right text-green-600">
                              {amount > 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={cashflowData.length + 1} className="px-3 py-2 text-xs text-gray-500 text-center">
                          No income data
                        </td>
                      </tr>
                    )}

                    {/* Operating Activities - Expenses */}
                    <tr className="bg-red-50">
                      <td colSpan={cashflowData.length + 1} className="px-3 py-2 text-xs font-bold text-gray-900">
                        OPERATING ACTIVITIES - EXPENSES
                      </td>
                    </tr>
                    {cashflowData[0]?.data?.operatingActivities?.expenses?.map((item, itemIndex) => (
                      <tr key={`expense-${itemIndex}`}>
                        <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-600 pl-6">
                          {item.description || item.name || 'Expense'}
                        </td>
                        {cashflowData.map((month, monthIndex) => {
                          const monthExpenses = month.data?.operatingActivities?.expenses || [];
                          const amount = monthExpenses[itemIndex]?.amount || 0;
                          return (
                            <td key={monthIndex} className="px-3 py-1.5 whitespace-nowrap text-xs text-right text-red-600">
                              {amount > 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={cashflowData.length + 1} className="px-3 py-2 text-xs text-gray-500 text-center">
                          No expense data
                        </td>
                      </tr>
                    )}

                    {/* Net Cashflow */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                        Net Cashflow
                      </td>
                      {chartData.map((month, index) => (
                        <td key={index} className={`px-3 py-2 whitespace-nowrap text-xs text-right font-bold ${month.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(month.netCashflow)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Cashflow - Income vs Expenses</h3>
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
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-50 p-3 border border-green-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Income</p>
                    <p className="text-base font-bold text-green-600">
                      {formatCurrency(chartData.reduce((sum, m) => sum + m.income, 0))}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 border border-red-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-base font-bold text-red-600">
                      {formatCurrency(chartData.reduce((sum, m) => sum + m.expenses, 0))}
                    </p>
                  </div>
                  <div className={`p-3 border ${chartData.reduce((sum, m) => sum + m.netCashflow, 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs font-medium text-gray-600 mb-1">Net Cashflow</p>
                    <p className={`text-base font-bold ${chartData.reduce((sum, m) => sum + m.netCashflow, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(chartData.reduce((sum, m) => sum + m.netCashflow, 0))}
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

export default Cashflow;

