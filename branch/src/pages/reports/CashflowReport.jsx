import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const CashflowReport = () => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cashflowData, setCashflowData] = useState({
    inflows: [],
    outflows: [],
    netCashflow: { amount: 0 },
    totalInflows: { amount: 0 },
    totalOutflows: { amount: 0 }
  });

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchCashflowData();
  }, [startDate, endDate]);

  const fetchCashflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/reports/cashflow`, {
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id'),
          start_date: startDate,
          end_date: endDate
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCashflowData(response.data);
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      setError(error.response?.data?.message || 'Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = `${BASE_URL}/reports/cashflow/export?boarding_house_id=${localStorage.getItem('boarding_house_id')}&start_date=${startDate}&end_date=${endDate}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `cashflow-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError(error.response?.data?.message || 'Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="px-6 mt-5 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-500">Loading cashflow data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 mt-5 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Cashflow Statement</h1>
        <p className="mt-1 text-sm text-gray-600">
          For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-sm text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaFileDownload className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Statement of Cash Flows</h3>
        </div>
        
        <div className="p-6">
          {/* Cash Inflows Section */}
          <div className="mb-8">
            <h4 className="text-xs font-bold text-gray-900 mb-4">Cash Inflows</h4>
            <div className="space-y-2">
              {cashflowData.inflows.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Total Inflows</span>
                <span>{formatCurrency(cashflowData.totalInflows.amount)}</span>
              </div>
            </div>
          </div>

          {/* Cash Outflows Section */}
          <div className="mb-8">
            <h4 className="text-xs font-bold text-gray-900 mb-4">Cash Outflows</h4>
            <div className="space-y-2">
              {cashflowData.outflows.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-900 font-medium">({formatCurrency(item.amount)})</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Total Outflows</span>
                <span>({formatCurrency(cashflowData.totalOutflows.amount)})</span>
              </div>
            </div>
          </div>

          {/* Net Cashflow */}
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between text-sm font-bold">
              <span>Net Cash Flow</span>
              <span className={cashflowData.netCashflow.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(cashflowData.netCashflow.amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashflowReport; 