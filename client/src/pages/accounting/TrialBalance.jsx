import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaDownload, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [summary, setSummary] = useState({
    totalDebits: 0,
    totalCredits: 0,
    difference: 0,
    isBalanced: false
  });

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/trial-balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setTrialBalance(response.data.data.accounts);
        setSummary(response.data.data.summary);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      setError('Failed to load trial balance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const filteredData = trialBalance.filter(item => {
    const matchesSearch = item.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.account_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'debit') return matchesSearch && item.debit_balance > 0;
    if (filterType === 'credit') return matchesSearch && item.credit_balance > 0;
    if (filterType === 'zero') return matchesSearch && item.debit_balance === 0 && item.credit_balance === 0;
    
    return matchesSearch;
  });

  const totalDebits = summary.totalDebits;
  const totalCredits = summary.totalCredits;

  const exportToCSV = () => {
    const csvContent = [
      ['Account Code', 'Account Name', 'Debit Balance', 'Credit Balance'],
      ...filteredData.map(item => [
        item.account_code,
        item.account_name,
        item.debit_balance.toFixed(2),
        item.credit_balance.toFixed(2)
      ]),
      ['', 'TOTAL', totalDebits.toFixed(2), totalCredits.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#f58020]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaFileAlt className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Trial Balance</h1>
          <p className="text-xs text-gray-600">Summary of all account balances as of current date</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
              >
                <option value="all">All Accounts</option>
                <option value="debit">Debit Balances</option>
                <option value="credit">Credit Balances</option>
                <option value="zero">Zero Balances</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#f58020] text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <FaDownload className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.account_code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.account_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {item.debit_balance > 0 ? formatCurrency(item.debit_balance) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {item.credit_balance > 0 ? formatCurrency(item.credit_balance) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900" colSpan="2">TOTAL</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  {formatCurrency(totalDebits)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  {formatCurrency(totalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Total Debits: <span className="font-semibold">{formatCurrency(totalDebits)}</span> | 
          Total Credits: <span className="font-semibold">{formatCurrency(totalCredits)}</span> | 
          Difference: <span className={`font-semibold ${summary.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.difference)}
          </span>
        </p>
        {summary.isBalanced ? (
          <p className="text-sm text-green-600 font-semibold mt-2">✓ Trial Balance is Balanced</p>
        ) : (
          <p className="text-sm text-red-600 font-semibold mt-2">⚠ Trial Balance is Not Balanced</p>
        )}
      </div>
    </div>
  );
};

export default TrialBalance;
