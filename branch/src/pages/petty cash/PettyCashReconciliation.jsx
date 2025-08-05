import React, { useState, useEffect } from 'react';
import { ScaleIcon, DocumentArrowDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';

const PettyCashReconciliation = () => {
  const [accounts, setAccounts] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    account_id: ''
  });

  const [reconcileForm, setReconcileForm] = useState({
    physical_count: '',
    variance_explanation: '',
    notes: ''
  });

  useEffect(() => {
    fetchAccounts();
    fetchReconciliations();
  }, []);

  useEffect(() => {
    fetchReconciliations();
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      const response = await axios.get('/api/petty-cash/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      // Ensure we always set an array, even if the response is unexpected
      const accountsData = response.data?.data || response.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch petty cash accounts');
      // Set empty array on error to prevent undefined issues
      setAccounts([]);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      let url = '/api/petty-cash/reconciliation/reports';
      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.account_id) params.append('account_id', filters.account_id);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      // Ensure we always set an array, even if the response is unexpected
      const reconciliationsData = response.data?.data || response.data || [];
      setReconciliations(Array.isArray(reconciliationsData) ? reconciliationsData : []);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      toast.error('Failed to fetch reconciliation reports');
      // Set empty array on error to prevent undefined issues
      setReconciliations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      await axios.post('/api/petty-cash/reconciliation', {
        petty_cash_account_id: selectedAccount.id,
        ...reconcileForm
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      toast.success('Reconciliation completed successfully');
      setShowReconcileModal(false);
      setReconcileForm({ physical_count: '', variance_explanation: '', notes: '' });
      fetchReconciliations();
      fetchAccounts(); // Refresh accounts to get updated balances
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      toast.error('Failed to create reconciliation');
    }
  };

  const exportToCSV = () => {
    if (!reconciliations.length) {
      toast.warning('No data to export');
      return;
    }

    const headers = [
      'Date', 'Account Name', 'Account Code', 'Assigned User', 
      'Book Balance', 'Physical Count', 'Variance', 'Variance Explanation', 
      'Reconciled By', 'Notes'
    ];
    
    const csvData = [
      headers,
      ...reconciliations.map(rec => [
        rec.reconciliation_date,
        rec.account_name,
        rec.account_code,
        rec.assigned_user_name,
        rec.book_balance,
        rec.physical_count,
        (parseFloat(rec.physical_count) - parseFloat(rec.book_balance)).toFixed(2),
        rec.variance_explanation || '',
        rec.reconciled_by_name,
        rec.notes || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `petty-cash-reconciliations-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mt-8 bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Petty Cash Reconciliation</h1>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-gray-600 text-white px-4 py-2 text-sm border border-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

      {/* Quick Reconcile Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {accounts && accounts.length > 0 && accounts.map((account) => (
            <div key={account.id} className="bg-white p-3 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{account.account_name}</h3>
                  <p className="text-xs text-gray-500">Code: {account.account_code}</p>
                  <p className="text-xs text-gray-500">Assigned to: {account.assigned_user_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-600">
                    ${parseFloat(account.current_balance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Book Balance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setReconcileForm({ 
                    physical_count: account.current_balance, 
                    variance_explanation: '', 
                    notes: '' 
                  });
                  setShowReconcileModal(true);
                }}
                className="w-full bg-gray-600 text-white px-3 py-2 text-sm border border-gray-200 hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <ScaleIcon className="h-4 w-4" />
                Reconcile
              </button>
            </div>
          ))}
          
          {(!accounts || accounts.length === 0) && !loading && (
            <div className="col-span-full text-center py-12">
              <ScaleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No petty cash accounts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create petty cash accounts first to start reconciliation.
              </p>
            </div>
          )}
        </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filters.account_id}
              onChange={(e) => setFilters({...filters, account_id: e.target.value})}
              className="w-full px-3 py-2 text-xs border border-gray-200 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">All Accounts</option>
              {accounts && accounts.length > 0 && accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name} ({account.account_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="w-full px-3 py-2 text-xs border border-gray-200 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="w-full px-3 py-2 text-xs border border-gray-200 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={() => setFilters({ start_date: '', end_date: '', account_id: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 text-xs border border-gray-200 hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation History */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-3 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Reconciliation History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book Balance
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Physical Count
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reconciled By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reconciliations && reconciliations.length > 0 && reconciliations.map((reconciliation) => {
                  const variance = parseFloat(reconciliation.physical_count) - parseFloat(reconciliation.book_balance);
                  return (
                    <tr key={reconciliation.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                        {new Date(reconciliation.reconciliation_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900">
                        <div>
                          <div className="font-medium">{reconciliation.account_name}</div>
                          <div className="text-gray-500">{reconciliation.account_code}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-right text-gray-900">
                        ${parseFloat(reconciliation.book_balance).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-right text-gray-900">
                        ${parseFloat(reconciliation.physical_count).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-right">
                        <span className={`font-medium ${
                          variance === 0 
                            ? 'text-green-600' 
                            : variance > 0 
                            ? 'text-gray-600' 
                            : 'text-red-600'
                        }`}>
                          {variance > 0 ? '+' : ''}${variance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                        {reconciliation.reconciled_by_name}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900">
                        {reconciliation.variance_explanation && (
                          <div className="mb-1 text-red-600 text-xs">
                            Variance: {reconciliation.variance_explanation}
                          </div>
                        )}
                        {reconciliation.notes && (
                          <div className="text-gray-600 text-xs">
                            {reconciliation.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {(!reconciliations || reconciliations.length === 0) && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">No reconciliations found</div>
              <div className="text-gray-400 text-xs mt-1">Reconciliation history will appear here</div>
            </div>
          )}
        </div>

      {/* Reconcile Modal */}
      {showReconcileModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Reconcile - {selectedAccount.account_name}
            </h3>
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Book Balance:</span>
                <span className="text-sm font-medium">${parseFloat(selectedAccount.current_balance).toFixed(2)}</span>
              </div>
            </div>
            <form onSubmit={handleReconcile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Physical Count</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={reconcileForm.physical_count}
                  onChange={(e) => setReconcileForm({...reconcileForm, physical_count: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {reconcileForm.physical_count && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Variance:</span>
                    <span className={`text-sm font-medium ${
                      (parseFloat(reconcileForm.physical_count) - parseFloat(selectedAccount.current_balance)) === 0 
                        ? 'text-green-600' 
                        : (parseFloat(reconcileForm.physical_count) - parseFloat(selectedAccount.current_balance)) > 0 
                        ? 'text-blue-600' 
                        : 'text-red-600'
                    }`}>
                      {(parseFloat(reconcileForm.physical_count) - parseFloat(selectedAccount.current_balance)) > 0 ? '+' : ''}
                      ${(parseFloat(reconcileForm.physical_count) - parseFloat(selectedAccount.current_balance)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {reconcileForm.physical_count && 
               Math.abs(parseFloat(reconcileForm.physical_count) - parseFloat(selectedAccount.current_balance)) > 0.01 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variance Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={reconcileForm.variance_explanation}
                    onChange={(e) => setReconcileForm({...reconcileForm, variance_explanation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Explain the reason for the variance..."
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={reconcileForm.notes}
                  onChange={(e) => setReconcileForm({...reconcileForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Complete Reconciliation
                </button>
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PettyCashReconciliation;