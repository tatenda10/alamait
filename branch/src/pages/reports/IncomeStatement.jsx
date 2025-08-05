import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import { format } from 'date-fns';
import BASE_URL from '../../utils/api';

const IncomeStatement = () => {
  const [period, setPeriod] = useState('custom');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const getBoardingHouseId = () => {
    return localStorage.getItem('boarding_house_id');
  };

  const getDateRange = (selectedPeriod) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    switch (selectedPeriod) {
      case 'current':
        return {
          start_date: format(firstDayOfMonth, 'yyyy-MM-dd'),
          end_date: format(lastDayOfMonth, 'yyyy-MM-dd')
        };
      case 'previous':
        const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start_date: format(firstDayOfPrevMonth, 'yyyy-MM-dd'),
          end_date: format(lastDayOfPrevMonth, 'yyyy-MM-dd')
        };
      case 'ytd':
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          start_date: format(firstDayOfYear, 'yyyy-MM-dd'),
          end_date: format(now, 'yyyy-MM-dd')
        };
      case 'custom':
        return dateRange;
      default:
        return dateRange;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dates = getDateRange(period);
      const boardingHouseId = getBoardingHouseId();

      const response = await axios.get(`${BASE_URL}/reports/income-statement`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: boardingHouseId,
          ...dates
        }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        params: err.config?.params
      });
      setError(err.response?.data?.message || 'Failed to fetch income statement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boardingHouseId = getBoardingHouseId();
    if (boardingHouseId) {
      fetchData();
    } else {
      setError('No boarding house selected');
      setLoading(false);
    }
  }, [period, dateRange]);

  const handleExport = async () => {
    try {
      const dates = getDateRange(period);
      const boardingHouseId = getBoardingHouseId();
      const response = await axios.get(`${BASE_URL}/reports/income-statement/export`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: boardingHouseId,
          ...dates
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `income_statement_${dates.start_date}_to_${dates.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export income statement');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Income Statement</h1>
        <p className="mt-1 text-xs text-gray-600">
          {period === 'ytd' ? 'Year to date' : period === 'previous' ? 'Previous month' : period === 'current' ? 'Current month' : 'Custom period'} profit and loss statement
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
          >
            <option value="current">Current Month</option>
            <option value="previous">Previous Month</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {period === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="px-2 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="px-2 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
              />
            </div>
          )}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-xs text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaFileDownload className="h-3 w-3 mr-2" />
          Export Statement
        </button>
      </div>

      {data && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900">Account</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Revenue Section */}
              <tr className="bg-gray-50">
                <td colSpan="2" className="px-6 py-3 text-xs font-medium text-gray-900">Revenue</td>
              </tr>
              {data.revenues.map((revenue) => (
                <tr key={revenue.code} className={revenue.level > 1 ? 'bg-gray-50' : ''}>
                  <td className={`px-6 py-2 text-sm text-gray-900 ${revenue.level > 1 ? 'pl-' + (revenue.level * 6) : ''}`}>
                    {revenue.code} - {revenue.name}
                  </td>
                  <td className="px-6 py-2 text-right text-sm text-gray-900">
                    {formatAmount(revenue.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-medium">
                <td className="px-6 py-2 text-sm text-gray-900">Total Revenue</td>
                <td className="px-6 py-2 text-right text-sm text-gray-900">
                  {formatAmount(data.summary.total_revenue)}
                </td>
              </tr>

              {/* Expenses Section */}
              <tr className="bg-gray-50">
                <td colSpan="2" className="px-6 py-3 text-xs font-medium text-gray-900">Expenses</td>
              </tr>
              {data.expenses.map((expense) => (
                <tr key={expense.code} className={expense.level > 1 ? 'bg-gray-50' : ''}>
                  <td className={`px-6 py-2 text-sm text-gray-900 ${expense.level > 1 ? 'pl-' + (expense.level * 6) : ''}`}>
                    {expense.code} - {expense.name}
                  </td>
                  <td className="px-6 py-2 text-right text-sm text-gray-900">
                    {formatAmount(expense.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-medium">
                <td className="px-6 py-2 text-sm text-gray-900">Total Expenses</td>
                <td className="px-6 py-2 text-right text-sm text-gray-900">
                  {formatAmount(data.summary.total_expenses)}
                </td>
              </tr>

              {/* Net Income */}
              <tr className="bg-gray-100 font-medium">
                <td className="px-6 py-3 text-sm text-gray-900">Net Income</td>
                <td className="px-6 py-3 text-right text-sm text-gray-900">
                  {formatAmount(data.summary.net_income)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncomeStatement; 