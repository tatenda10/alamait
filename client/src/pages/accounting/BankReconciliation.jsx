import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaUpload, 
  FaBalanceScale, 
  FaEye, 
  FaCheck, 
  FaTimes,
  FaDownload,
  FaFileExcel,
  FaSync,
  FaSearch,
  FaFilter,
  FaPlus
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

const BankReconciliation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [filters, setFilters] = useState({
    account_id: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  const [importForm, setImportForm] = useState({
    account_id: '',
    statement_date: '',
    opening_balance: '',
    closing_balance: '',
    bank_statement: null
  });

  const [reconcileForm, setReconcileForm] = useState({
    account_id: '',
    reconciliation_date: '',
    book_balance: '',
    bank_balance: '',
    statement_id: '',
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
      const response = await axios.get(`${BASE_URL}/api/bank-reconciliation/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await axios.get(`${BASE_URL}/api/bank-reconciliation/reconciliations?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReconciliations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      toast.error('Failed to fetch reconciliations');
    }
  };

  const handleImportStatement = async (e) => {
    e.preventDefault();
    
    if (!importForm.bank_statement) {
      toast.error('Please select a bank statement file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('account_id', importForm.account_id);
      formData.append('statement_date', importForm.statement_date);
      formData.append('opening_balance', importForm.opening_balance);
      formData.append('closing_balance', importForm.closing_balance);
      formData.append('bank_statement', importForm.bank_statement);

      const response = await axios.post(`${BASE_URL}/api/bank-reconciliation/import-statement`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Bank statement imported successfully');
      setShowImportModal(false);
      setImportForm({
        account_id: '',
        statement_date: '',
        opening_balance: '',
        closing_balance: '',
        bank_statement: null
      });
      fetchReconciliations();
    } catch (error) {
      console.error('Error importing statement:', error);
      toast.error('Failed to import bank statement');
    }
  };

  const handleCreateReconciliation = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/api/bank-reconciliation/reconciliations`, reconcileForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Reconciliation created successfully');
      setShowReconcileModal(false);
      setReconcileForm({
        account_id: '',
        reconciliation_date: '',
        book_balance: '',
        bank_balance: '',
        statement_id: '',
        notes: ''
      });
      
      // Navigate to the new reconciliation
      navigate(`/dashboard/accounting/bank-reconciliation/${response.data.data.id}`);
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      toast.error('Failed to create reconciliation');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImportForm(prev => ({ ...prev, bank_statement: file }));
  };

  const handleAccountChange = (accountId) => {
    const account = accounts.find(acc => acc.id == accountId);
    setSelectedAccount(account);
    setReconcileForm(prev => ({ ...prev, account_id: accountId, book_balance: account?.current_balance || 0 }));
  };

  const exportToExcel = () => {
    // Implementation for exporting reconciliation data to Excel
    toast.info('Export functionality coming soon');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reconciled': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'unreconciled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-600">Reconcile your bank accounts with bank statements</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FaUpload className="mr-2" />
            Import Statement
          </button>
          <button
            onClick={() => setShowReconcileModal(true)}
            className="bg-[#E78D69] text-white px-4 py-2 rounded-lg hover:bg-[#E78D69]/90 flex items-center"
          >
            <FaBalanceScale className="mr-2" />
            New Reconciliation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filters.account_id}
              onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Reconciled</option>
              <option value="unreconciled">Unreconciled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Reconciliations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Reconciliations</h2>
            <button
              onClick={exportToExcel}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <FaFileExcel className="mr-2" />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reconciliations.map((reconciliation) => {
                const progress = reconciliation.total_items > 0 
                  ? Math.round((reconciliation.reconciled_items / reconciliation.total_items) * 100)
                  : 0;
                
                return (
                  <tr key={reconciliation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(reconciliation.reconciliation_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reconciliation.account_name}</div>
                        <div className="text-sm text-gray-500">{reconciliation.account_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(reconciliation.book_balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(reconciliation.bank_balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        parseFloat(reconciliation.difference) === 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {parseFloat(reconciliation.difference) > 0 ? '+' : ''}${parseFloat(reconciliation.difference).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reconciliation.status)}`}>
                        {reconciliation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/dashboard/accounting/bank-reconciliation/${reconciliation.id}`)}
                        className="text-[#E78D69] hover:text-[#E78D69]/80 mr-3"
                      >
                        <FaEye className="inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {reconciliations.length === 0 && (
            <div className="text-center py-8">
              <FaBalanceScale className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reconciliations</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new reconciliation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Statement Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Bank Statement</h3>
              <form onSubmit={handleImportStatement}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <select
                      required
                      value={importForm.account_id}
                      onChange={(e) => setImportForm(prev => ({ ...prev, account_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date</label>
                    <input
                      type="date"
                      required
                      value={importForm.statement_date}
                      onChange={(e) => setImportForm(prev => ({ ...prev, statement_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={importForm.opening_balance}
                      onChange={(e) => setImportForm(prev => ({ ...prev, opening_balance: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={importForm.closing_balance}
                      onChange={(e) => setImportForm(prev => ({ ...prev, closing_balance: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement File</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      required
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Supported formats: Excel (.xlsx, .xls) and CSV</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Import
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Reconciliation Modal */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Reconciliation</h3>
              <form onSubmit={handleCreateReconciliation}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <select
                      required
                      value={reconcileForm.account_id}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reconciliation Date</label>
                    <input
                      type="date"
                      required
                      value={reconcileForm.reconciliation_date}
                      onChange={(e) => setReconcileForm(prev => ({ ...prev, reconciliation_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={reconcileForm.book_balance}
                      onChange={(e) => setReconcileForm(prev => ({ ...prev, book_balance: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={reconcileForm.bank_balance}
                      onChange={(e) => setReconcileForm(prev => ({ ...prev, bank_balance: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={reconcileForm.notes}
                      onChange={(e) => setReconcileForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowReconcileModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E78D69] text-white rounded-md hover:bg-[#E78D69]/90"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;
