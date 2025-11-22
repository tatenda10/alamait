import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';

const BalanceSheet = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);

  const fetchBalanceSheetData = async () => {
    setLoading(true);
    setShowBalanceSheet(false);
    
    try {
      const params = new URLSearchParams({
        as_of_date: asOfDate
      });

      const response = await axios.get(`${BASE_URL}/reports/balance-sheet?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setBalanceSheetData(response.data.data);
        setShowBalanceSheet(true);
      } else if (response.data) {
        setBalanceSheetData(response.data);
        setShowBalanceSheet(true);
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="mt-0.5 text-xs text-gray-500">View financial position as of a specific date</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">As of Date</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full text-xs border border-gray-300 px-2 py-1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchBalanceSheetData}
                disabled={loading}
                className="w-full bg-[#f58020] text-white text-xs font-medium py-1.5 px-4 hover:bg-[#e6701a] disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Balance Sheet */}
        {showBalanceSheet && balanceSheetData && (
          <div className="bg-white border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Balance Sheet - As of {new Date(balanceSheetData.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
            </div>

            <div className="p-3">
              {/* Assets Section */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2">ASSETS</h4>
                <div className="space-y-1">
                  {balanceSheetData.balanceSheet?.assets
                    ?.filter(asset => asset.code !== '10005' && asset.code !== 'STU-DEBT' && (asset.debitBalance > 0 || asset.creditBalance > 0))
                    .map((asset, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between text-xs py-1 border-b border-gray-100"
                      >
                        <span className="text-gray-600">{asset.name || asset.account_name}</span>
                        <span className="text-gray-900 font-medium">
                          {asset.debitBalance > 0 ? formatCurrency(asset.debitBalance) : 
                           asset.creditBalance > 0 ? `(${formatCurrency(asset.creditBalance)})` : 
                           formatCurrency(0)}
                        </span>
                      </div>
                    ))}
                  
                  {/* Student Debtors - only show if it exists in balanceSheet.assets, otherwise use summary */}
                  {(balanceSheetData.balanceSheet?.assets?.find(a => a.code === 'STU-DEBT') || balanceSheetData.summary?.totalDebtors > 0) && (
                    <div 
                      className="flex justify-between text-xs py-1 border-b border-gray-100"
                    >
                      <span className="text-gray-600">Student Debtors</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(balanceSheetData.balanceSheet?.assets?.find(a => a.code === 'STU-DEBT')?.debitBalance || balanceSheetData.summary?.totalDebtors || 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200 mt-1">
                    <span>Total Assets</span>
                    <span>{formatCurrency(balanceSheetData.summary?.totalAssets || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities Section */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2">LIABILITIES</h4>
                <div className="space-y-1">
                  {balanceSheetData.balanceSheet?.liabilities
                    ?.filter(liability => liability.code !== 'STU-PREP' && (liability.debitBalance > 0 || liability.creditBalance > 0))
                    .map((liability, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between text-xs py-1 border-b border-gray-100"
                      >
                        <span className="text-gray-600">{liability.name || liability.account_name}</span>
                        <span className="text-gray-900 font-medium">
                          {liability.creditBalance > 0 ? formatCurrency(liability.creditBalance) : 
                           liability.debitBalance > 0 ? `(${formatCurrency(liability.debitBalance)})` : 
                           formatCurrency(0)}
                        </span>
                      </div>
                    ))}
                  
                  {/* Student Prepayments - only show if it exists in balanceSheet.liabilities, otherwise use summary */}
                  {(balanceSheetData.balanceSheet?.liabilities?.find(l => l.code === 'STU-PREP') || balanceSheetData.summary?.totalPrepayments > 0) && (
                    <div 
                      className="flex justify-between text-xs py-1 border-b border-gray-100"
                    >
                      <span className="text-gray-600">Student Prepayments</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(balanceSheetData.balanceSheet?.liabilities?.find(l => l.code === 'STU-PREP')?.creditBalance || balanceSheetData.summary?.totalPrepayments || 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200 mt-1">
                    <span>Total Liabilities</span>
                    <span>{formatCurrency(balanceSheetData.summary?.totalLiabilities || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Equity Section */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2">EQUITY</h4>
                <div className="space-y-1">
                  {balanceSheetData.balanceSheet?.equity
                    ?.filter(equity => equity.debitBalance > 0 || equity.creditBalance > 0)
                    .map((equity, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between text-xs py-1 border-b border-gray-100"
                      >
                        <span className="text-gray-600">{equity.name || equity.account_name}</span>
                        <span className="text-gray-900 font-medium">
                          {equity.creditBalance > 0 ? formatCurrency(equity.creditBalance) : 
                           equity.debitBalance > 0 ? `(${formatCurrency(equity.debitBalance)})` : 
                           formatCurrency(0)}
                        </span>
                      </div>
                    ))}
                  
                  {/* Current Period Profit/Loss */}
                  <div 
                    className="flex justify-between text-xs py-1 border-b border-gray-100 mt-1 pt-1 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate('/dashboard/income-statement')}
                  >
                    <span className="text-gray-600">Current Period Profit/(Loss)</span>
                    <span className={`font-medium ${(balanceSheetData.summary?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balanceSheetData.summary?.netIncome || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200 mt-1">
                    <span>Total Equity</span>
                    <span>{formatCurrency(balanceSheetData.summary?.totalEquityWithIncome || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Balance Sheet Equation */}
              <div className="pt-3 border-t-2 border-gray-300">
                <div className="flex justify-between text-xs font-bold">
                  <span>Total Liabilities + Equity</span>
                  <span>{formatCurrency(balanceSheetData.summary?.totalLiabilitiesAndEquity || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold mt-2">
                  <span>Balance Check</span>
                  <span className={balanceSheetData.summary?.isBalanced ? 'text-green-600' : 'text-red-600'}>
                    {balanceSheetData.summary?.isBalanced ? '✓ BALANCED' : '✗ NOT BALANCED'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Difference: {formatCurrency((balanceSheetData.summary?.totalAssets || 0) - (balanceSheetData.summary?.totalLiabilitiesAndEquity || 0))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BalanceSheet;

