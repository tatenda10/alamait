import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const BalanceSheet = () => {
  const [asOfDate, setAsOfDate] = useState(getDefaultDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState({
    reportDate: '',
    balanceSheet: {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: []
    },
    summary: {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      totalEquityWithIncome: 0,
      totalLiabilitiesAndEquity: 0,
      isBalanced: false
    }
  });

  function getDefaultDate() {
    return new Date().toISOString().split('T')[0];
  }

  const fetchBalanceSheetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = {
        as_of_date: asOfDate
      };

      console.log('Fetching balance sheet with params:', params);

      const response = await axios.get(`${BASE_URL}/reports/balance-sheet`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Balance sheet response:', response.data);
      setBalanceSheetData(response.data.data);
      setShowBalanceSheet(true);
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
      setError(error.response?.data?.message || 'Failed to load balance sheet data');
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

      const params = new URLSearchParams({
        as_of_date: asOfDate
      });

      const url = `${BASE_URL}/reports/balance-sheet/export?${params.toString()}`;
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
      link.download = `balance-sheet-${asOfDate}.csv`;
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
          <div className="text-sm text-gray-500">Loading balance sheet data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-sm font-bold text-gray-900">Balance Sheet</h1>
        <p className="mt-1 text-xs text-gray-600">
          As of {new Date(asOfDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchBalanceSheetData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Report
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
          >
            <FaFileDownload className="text-xs" />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-xs text-red-800">{error}</div>
        </div>
      )}

      {showBalanceSheet && (
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900">Balance Sheet</h3>
            <p className="text-xs text-gray-600 mt-1">
              As of {new Date(balanceSheetData.reportDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="p-6">
            {/* Assets Section */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-900 mb-4">ASSETS</h4>
              <div className="space-y-2">
                {balanceSheetData.balanceSheet.assets
                  .filter(asset => asset.debitBalance > 0 || asset.creditBalance > 0)
                  .map((asset, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{asset.name}</span>
                      <span className="text-gray-900 font-medium">
                        {asset.debitBalance > 0 ? formatCurrency(asset.debitBalance) : 
                         asset.creditBalance > 0 ? `(${formatCurrency(asset.creditBalance)})` : 
                         formatCurrency(0)}
                      </span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t">
                  <span>Total Assets</span>
                  <span>{formatCurrency(balanceSheetData.summary.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities Section */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-900 mb-4">LIABILITIES</h4>
              <div className="space-y-2">
                {balanceSheetData.balanceSheet.liabilities
                  .filter(liability => liability.debitBalance > 0 || liability.creditBalance > 0)
                  .map((liability, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{liability.name}</span>
                      <span className="text-gray-900 font-medium">
                        {liability.creditBalance > 0 ? formatCurrency(liability.creditBalance) : 
                         liability.debitBalance > 0 ? `(${formatCurrency(liability.debitBalance)})` : 
                         formatCurrency(0)}
                      </span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.summary.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Equity Section */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-900 mb-4">EQUITY</h4>
              <div className="space-y-2">
                {balanceSheetData.balanceSheet.equity
                  .filter(equity => equity.debitBalance > 0 || equity.creditBalance > 0)
                  .map((equity, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{equity.name}</span>
                      <span className="text-gray-900 font-medium">
                        {equity.creditBalance > 0 ? formatCurrency(equity.creditBalance) : 
                         equity.debitBalance > 0 ? `(${formatCurrency(equity.debitBalance)})` : 
                         formatCurrency(0)}
                      </span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t">
                  <span>Total Equity</span>
                  <span>{formatCurrency(balanceSheetData.summary.totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Revenue and Expenses (P&L) */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-900 mb-4">REVENUE</h4>
              <div className="space-y-2">
                {balanceSheetData.balanceSheet.revenue
                  .filter(revenue => revenue.debitBalance > 0 || revenue.creditBalance > 0)
                  .map((revenue, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{revenue.name}</span>
                      <span className="text-gray-900 font-medium">
                        {revenue.creditBalance > 0 ? formatCurrency(revenue.creditBalance) : 
                         revenue.debitBalance > 0 ? `(${formatCurrency(revenue.debitBalance)})` : 
                         formatCurrency(0)}
                      </span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(balanceSheetData.summary.totalRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-900 mb-4">EXPENSES</h4>
              <div className="space-y-2">
                {balanceSheetData.balanceSheet.expenses
                  .filter(expense => expense.debitBalance > 0 || expense.creditBalance > 0)
                  .map((expense, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{expense.name}</span>
                      <span className="text-gray-900 font-medium">
                        {expense.debitBalance > 0 ? formatCurrency(expense.debitBalance) : 
                         expense.creditBalance > 0 ? `(${formatCurrency(expense.creditBalance)})` : 
                         formatCurrency(0)}
                      </span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(balanceSheetData.summary.totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold pt-2 border-t-2 border-gray-400">
                <span>Net Income (Revenue - Expenses)</span>
                <span className={balanceSheetData.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(balanceSheetData.summary.netIncome)}
                </span>
              </div>
            </div>

            {/* Balance Sheet Equation */}
            <div className="pt-4 border-t-2 border-gray-900">
              <div className="flex justify-between text-xs font-bold">
                <span>Total Liabilities + Equity</span>
                <span>{formatCurrency(balanceSheetData.summary.totalLiabilitiesAndEquity)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold mt-2">
                <span>Balance Check</span>
                <span className={balanceSheetData.summary.isBalanced ? 'text-green-600' : 'text-red-600'}>
                  {balanceSheetData.summary.isBalanced ? '✅ BALANCED' : '❌ NOT BALANCED'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Difference: {formatCurrency(balanceSheetData.summary.totalAssets - balanceSheetData.summary.totalLiabilitiesAndEquity)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
