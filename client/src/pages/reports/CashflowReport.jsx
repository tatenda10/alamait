import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const CashflowReport = () => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCashflow, setShowCashflow] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');
  const [cashflowData, setCashflowData] = useState({
    inflows: [],
    outflows: [],
    netCashflow: { amount: 0 },
    totalInflows: { amount: 0 },
    totalOutflows: { amount: 0 },
    totalCashPosition: { amount: 0 },
    cashAccountBalances: []
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

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setBoardingHouses(response.data);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  const fetchCashflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = {
        start_date: startDate,
        end_date: endDate
      };

      // Add boarding house filter if not 'all'
      if (selectedBoardingHouse !== 'all') {
        params.boarding_house_id = selectedBoardingHouse;
      }

      console.log('Fetching cashflow with params:', params);

      const response = await axios.get(`${BASE_URL}/reports/cashflow`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Cashflow response:', response.data);
      console.log('Total Cash Position:', response.data.totalCashPosition);
      console.log('Cash Account Balances:', response.data.cashAccountBalances);
      setCashflowData(response.data);
      setShowCashflow(true);
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      setError(error.response?.data?.message || 'Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  };

  // Load boarding houses on component mount
  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      if (selectedBoardingHouse !== 'all') {
        params.append('boarding_house_id', selectedBoardingHouse);
      }

      const url = `${BASE_URL}/reports/cashflow/export?${params.toString()}`;
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

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-sm font-bold text-gray-900">Cashflow Statement</h1>
        <p className="mt-1 text-xs text-gray-600">
          For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Boarding House</label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
            >
              <option value="all">All Boarding Houses</option>
              {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>
                  {bh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCashflowData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-xs text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:ring-offset-2"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExport}
            disabled={!showCashflow}
            className="flex items-center px-4 py-2 text-xs text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:ring-offset-2"
          >
            <FaFileDownload className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded">
          <div className="text-xs text-red-800">{error}</div>
        </div>
      )}

      {showCashflow && (
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900">Statement of Cash Flows</h3>
          </div>
          
          <div className="p-6">
          {/* Cash Inflows Section */}
          <div className="mb-8">
            <h4 className="text-xs font-bold text-gray-900 mb-4">Cash Inflows</h4>
            <div className="space-y-2">
              {cashflowData.inflows.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold pt-2 border-t">
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
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-900 font-medium">({formatCurrency(item.amount)})</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold pt-2 border-t">
                <span>Total Outflows</span>
                <span>({formatCurrency(cashflowData.totalOutflows.amount)})</span>
              </div>
            </div>
          </div>

          {/* Net Cashflow */}
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex justify-between text-xs font-bold">
              <span>Net Cash Flow</span>
              <span className={cashflowData.netCashflow.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(cashflowData.netCashflow.amount)}
              </span>
            </div>
          </div>

          {/* Total Cash Position */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-xs font-bold mb-4">
              <span>Total Cash Position</span>
              <span className="text-blue-600">
                {formatCurrency(cashflowData.totalCashPosition?.amount || 0)}
              </span>
            </div>
            
            {/* Individual Cash Account Balances */}
            {cashflowData.cashAccountBalances && cashflowData.cashAccountBalances.length > 0 && (
              <div className="space-y-2 ml-4">
                {cashflowData.cashAccountBalances.map((account, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600">
                    <span>{account.name}</span>
                    <span>{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowReport;
