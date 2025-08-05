import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';

const PettyCashLedger = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchLedger();
  }, [accountId, dateRange]);

  const fetchLedger = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      let url = `/api/petty-cash/ledger/${accountId}`;
      const params = new URLSearchParams();
      
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      setAccount(response.data.account);
      setLedger(response.data.ledger);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast.error('Failed to fetch petty cash ledger');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!ledger.length) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Description', 'Reference', 'Amount In', 'Amount Out', 'Balance Change', 'Status'];
    const csvData = [
      headers,
      ...ledger.map(entry => [
        entry.transaction_date,
        entry.type === 'issuance' ? 'Cash Issuance' : 'Expense',
        entry.description,
        entry.reference_number || '',
        entry.type === 'issuance' ? entry.amount : '',
        entry.type === 'expense' ? entry.expense_amount : '',
        entry.balance_change,
        entry.status
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `petty-cash-ledger-${account?.account_code}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const calculateRunningBalance = () => {
    let runningBalance = account?.initial_balance || 0;
    return ledger.map(entry => {
      runningBalance += parseFloat(entry.balance_change);
      return { ...entry, running_balance: runningBalance };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Account not found</h2>
          <button
            onClick={() => navigate('/dashboard/petty-cash')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Petty Cash
          </button>
        </div>
      </div>
    );
  }

  const ledgerWithBalance = calculateRunningBalance();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/petty-cash')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{account.account_name}</h1>
            <p className="text-sm text-gray-500">
              Code: {account.account_code} | Assigned to: {account.assigned_user_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${parseFloat(account.current_balance).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Current Balance</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={() => setDateRange({ start_date: '', end_date: '' })}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Out
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Running Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerWithBalance.map((entry, index) => (
                <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.type === 'issuance' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type === 'issuance' ? 'Cash Issuance' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {entry.type === 'issuance' && (
                      <span className="text-green-600 font-medium">
                        +${parseFloat(entry.amount).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {entry.type === 'expense' && (
                      <span className="text-red-600 font-medium">
                        -${parseFloat(entry.expense_amount).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    ${parseFloat(entry.running_balance).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === 'approved' || entry.status === 'issued'
                        ? 'bg-green-100 text-green-800'
                        : entry.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ledger.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {dateRange.start_date || dateRange.end_date 
                ? 'No transactions found for the selected date range.' 
                : 'No transactions have been recorded for this account yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {ledger.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Issuances</h3>
            <p className="text-2xl font-bold text-green-600">
              ${ledger
                .filter(entry => entry.type === 'issuance')
                .reduce((sum, entry) => sum + parseFloat(entry.amount), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">
              ${ledger
                .filter(entry => entry.type === 'expense')
                .reduce((sum, entry) => sum + parseFloat(entry.expense_amount), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-500">Net Change</h3>
            <p className={`text-2xl font-bold ${
              ledger.reduce((sum, entry) => sum + parseFloat(entry.balance_change), 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              ${ledger
                .reduce((sum, entry) => sum + parseFloat(entry.balance_change), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-500">Transaction Count</h3>
            <p className="text-2xl font-bold text-blue-600">
              {ledger.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashLedger;