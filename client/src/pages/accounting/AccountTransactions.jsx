import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiFilter, 
  FiDownload,
  FiRefreshCw,
  FiEdit2,
  FiX
} from 'react-icons/fi';
import BASE_URL from '../../context/Api';

const AccountTransactions = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    limit: 20,
    offset: 0
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    transaction_date: '',
    reference_no: '',
    description: '',
    journal_entries: []
  });
  const [editLoading, setEditLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    if (startDate || endDate) {
      setFilters(prev => ({
        ...prev,
        start_date: startDate || '',
        end_date: endDate || ''
      }));
    }
  }, [location.search]);

  // Fetch accounts for dropdown
  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...');
      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': localStorage.getItem('boarding_house_id') || '1'
        }
      });
      console.log('Accounts response:', response.data);
      
      // Flatten the hierarchical structure for the dropdown
      const flattenAccounts = (accounts) => {
        let flat = [];
        accounts.forEach(account => {
          flat.push(account);
          if (account.children && account.children.length > 0) {
            flat = flat.concat(flattenAccounts(account.children));
          }
        });
        return flat;
      };
      
      const allAccounts = flattenAccounts(response.data.data || []);
      console.log('Flattened accounts:', allAccounts);
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Try alternative endpoint
      try {
        const response = await axios.get(`${BASE_URL}/coa/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Alternative accounts response:', response.data);
        
        // Flatten the hierarchical structure for the dropdown
        const flattenAccounts = (accounts) => {
          let flat = [];
          accounts.forEach(account => {
            flat.push(account);
            if (account.children && account.children.length > 0) {
              flat = flat.concat(flattenAccounts(account.children));
            }
          });
          return flat;
        };
        
        const allAccounts = flattenAccounts(response.data.data || []);
        console.log('Flattened accounts from alternative:', allAccounts);
        setAccounts(allAccounts);
      } catch (altError) {
        console.error('Error fetching accounts from alternative endpoint:', altError);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccounts();
    }
  }, [token]);

  const fetchTransactions = async () => {
    if (!accountId || !token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      params.append('limit', filters.limit);
      params.append('offset', filters.offset);

      console.log('Fetching transactions for account:', accountId);
      console.log('API URL:', `${BASE_URL}/transactions/account/${accountId}/transactions?${params}`);

      const response = await axios.get(
        `${BASE_URL}/transactions/account/${accountId}/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Transactions response:', response.data);
      setAccount(response.data.account);
      setTransactions(response.data.transactions || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [accountId, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset to first page when filters change
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transactions');
  };

  const handleEdit = async (transaction) => {
    // Check transaction type and handle accordingly
    const transactionType = transaction.transaction_type;
    
    // For now, we'll handle all transaction types in the same modal
    // but we'll show different fields based on the transaction type
    setEditingTransaction(transaction);
    
    // Ensure accounts are loaded
    if (accounts.length === 0) {
      await fetchAccounts();
    }
    
    // Fetch all journal entries for this transaction
    let journalEntries = [];
    try {
      const response = await axios.get(`${BASE_URL}/transactions/${transaction.transaction_id}/journal-entries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      journalEntries = response.data || [];
      console.log('Journal entries fetched:', journalEntries);
      
      // Transform the journal entries to match the expected structure
      journalEntries = journalEntries.map(entry => ({
        id: entry.id,
        account_id: entry.account_id,
        entry_type: entry.entry_type,
        amount: entry.amount,
        description: entry.description || ''
      }));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      // Fallback to the current entry
      journalEntries = [{
        account_id: transaction.account_id || accountId,
        entry_type: transaction.debit > 0 ? 'debit' : 'credit',
        amount: transaction.debit > 0 ? transaction.debit : transaction.credit,
        description: transaction.entry_description || ''
      }];
    }
    
    // Convert date to yyyy-MM-dd format
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        let date;
        // Handle different date formats
        if (typeof dateString === 'string') {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          // If it's an ISO string, parse it
          if (dateString.includes('T') || dateString.includes('Z')) {
            date = new Date(dateString);
          } else {
            // Try to parse as a regular date string
            date = new Date(dateString);
          }
        } else {
          date = new Date(dateString);
        }
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', dateString);
          return '';
        }
        
        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };
    
    // Set up the form data based on transaction type
    let initialFormData = {
      transaction_date: formatDateForInput(transaction.transaction_date),
      reference_no: transaction.reference_no,
      description: transaction.transaction_description || '',
      journal_entries: journalEntries.length > 0 ? journalEntries : [
        {
          account_id: accountId,
          entry_type: transaction.debit > 0 ? 'debit' : 'credit',
          amount: transaction.debit > 0 ? transaction.debit : transaction.credit,
          description: transaction.entry_description || ''
        }
      ]
    };

    // Add transaction type specific fields
    if (transactionType && (
      transactionType.includes('monthly_rent') || 
      transactionType.includes('admin_fee') || 
      transactionType.includes('security_deposit') ||
      transactionType.includes('penalty_fee') ||
      transactionType.includes('payment')
    )) {
      // This is a student payment - add student-specific fields
      initialFormData.transaction_type = 'student_payment';
      initialFormData.student_id = transaction.student_id;
    } else if (transactionType && (
      transactionType.includes('expense') || 
      transactionType.includes('supplier_payment')
    )) {
      // This is an expense - add expense-specific fields
      initialFormData.transaction_type = 'expense';
    } else if (transactionType && transactionType.includes('petty_cash')) {
      // This is a petty cash transaction - add petty cash-specific fields
      initialFormData.transaction_type = 'petty_cash';
    } else {
      // Default: Manual transaction
      initialFormData.transaction_type = 'manual';
    }

    console.log('Initial form data:', initialFormData);
    setEditFormData(initialFormData);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      // Prepare the data to send
      const updateData = {
        transaction_date: editFormData.transaction_date,
        reference_no: editFormData.reference_no,
        description: editFormData.description,
        journal_entries: editFormData.journal_entries
      };

      // Add transaction type specific data
      if (editFormData.transaction_type === 'student_payment') {
        updateData.transaction_type = 'student_payment';
        updateData.student_id = editFormData.student_id;
      } else if (editFormData.transaction_type === 'expense') {
        updateData.transaction_type = 'expense';
      } else if (editFormData.transaction_type === 'petty_cash') {
        updateData.transaction_type = 'petty_cash';
      }

      await axios.put(`${BASE_URL}/transactions/${editingTransaction.transaction_id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setEditModalOpen(false);
      setEditingTransaction(null);
      fetchTransactions(); // Refresh the list
      
      // Show success message based on transaction type
      const successMessage = editFormData.transaction_type === 'student_payment' 
        ? 'Student payment updated successfully'
        : editFormData.transaction_type === 'expense'
        ? 'Expense transaction updated successfully'
        : editFormData.transaction_type === 'petty_cash'
        ? 'Petty cash transaction updated successfully'
        : 'Transaction updated successfully';
      
      // You can add a toast notification here if you have one
      console.log(successMessage);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJournalEntryChange = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      journal_entries: prev.journal_entries.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addJournalEntry = () => {
    setEditFormData(prev => ({
      ...prev,
      journal_entries: [...prev.journal_entries, {
        account_id: '',
        entry_type: 'debit',
        amount: 0,
        description: ''
      }]
    }));
  };

  const removeJournalEntry = (index) => {
    if (editFormData.journal_entries.length > 1) {
      setEditFormData(prev => ({
        ...prev,
        journal_entries: prev.journal_entries.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Account Transactions
              </h1>
              {account && (
                <p className="text-xs text-gray-600">
                  {account.code} - {account.name} ({account.type})
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-3 py-2 text-xs text-white border border-gray-200"
                style={{ backgroundColor: '#E78D69' }}
              >
                <FiRefreshCw size={14} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-xs text-white border border-gray-200"
                style={{ backgroundColor: '#E78D69' }}
              >
                <FiDownload size={14} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FiCalendar size={14} className="text-gray-400" />
              <input
                type="date"
                className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                placeholder="Start Date"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                placeholder="End Date"
              />
            </div>
            <select
              className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            {(filters.start_date || filters.end_date) && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, start_date: '', end_date: '', offset: 0 }))}
                className="text-xs text-white px-3 py-1"
                style={{ backgroundColor: '#E78D69' }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-xs">Loading transactions...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-xs font-medium text-gray-500">
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Reference</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-right">Debit</th>
                      <th className="px-6 py-3 text-right">Credit</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-xs">
                          No transactions found for this account
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction, index) => (
                        <tr key={`${transaction.transaction_id}-${transaction.journal_entry_id}`} className="text-xs text-gray-700 hover:bg-gray-50">
                          <td className="px-6 py-3">{formatDate(transaction.transaction_date)}</td>
                          <td className="px-6 py-3">{transaction.reference_no}</td>
                          <td className="px-6 py-3">
                            <div>
                              <div className="font-medium">{transaction.transaction_description}</div>
                              {transaction.entry_description && (
                                <div className="text-gray-500 text-xs">{transaction.entry_description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs ${
                              transaction.status === 'posted' 
                                ? 'bg-green-100 text-green-800' 
                                : transaction.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {(transaction.status === 'draft' || transaction.status === 'posted') && (
                              <button
                                onClick={() => handleEdit(transaction)}
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                title="Edit transaction"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} transactions
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
                        disabled={filters.offset === 0}
                        className="px-4 py-2 text-xs border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        style={{ backgroundColor: filters.offset === 0 ? '#9CA3AF' : '#E78D69' }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
                        disabled={!pagination.has_more}
                        className="px-4 py-2 text-xs border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        style={{ backgroundColor: !pagination.has_more ? '#9CA3AF' : '#E78D69' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Edit Transaction</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              {/* Transaction Type Information */}
              {editFormData.transaction_type && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Type</h3>
                  <div className="text-xs text-gray-600">
                    {editFormData.transaction_type === 'student_payment' && (
                      <div>
                        <p><strong>Type:</strong> Student Payment</p>
                        {editFormData.student_id && <p><strong>Student ID:</strong> {editFormData.student_id}</p>}
                        <p className="text-yellow-600 mt-1">
                          ⚠️ This is a student payment transaction. Editing this will affect the student's payment records.
                        </p>
                      </div>
                    )}
                    {editFormData.transaction_type === 'expense' && (
                      <div>
                        <p><strong>Type:</strong> Expense Transaction</p>
                        <p className="text-yellow-600 mt-1">
                          ⚠️ This is an expense transaction. Editing this will affect expense records.
                        </p>
                      </div>
                    )}
                    {editFormData.transaction_type === 'petty_cash' && (
                      <div>
                        <p><strong>Type:</strong> Petty Cash Transaction</p>
                        <p className="text-yellow-600 mt-1">
                          ⚠️ This is a petty cash transaction. Editing this will affect petty cash records.
                        </p>
                      </div>
                    )}
                    {editFormData.transaction_type === 'manual' && (
                      <div>
                        <p><strong>Type:</strong> Manual Transaction</p>
                        <p className="text-blue-600 mt-1">
                          ℹ️ This is a manual transaction. You can edit all fields.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => handleEditChange('transaction_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.reference_no}
                    onChange={(e) => handleEditChange('reference_no', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editFormData.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Journal Entries</h3>
                  <button
                    type="button"
                    onClick={addJournalEntry}
                    className="text-xs text-white px-3 py-1"
                    style={{ backgroundColor: '#E78D69' }}
                  >
                    Add Entry
                  </button>
                </div>
                
                <div className="space-y-3">
                  {editFormData.journal_entries && editFormData.journal_entries.length > 0 ? (
                    editFormData.journal_entries.map((entry, index) => (
                      <div key={entry.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Account
                          </label>
                          <select
                            value={entry.account_id || ''}
                            onChange={(e) => handleJournalEntryChange(index, 'account_id', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Account</option>
                            {accounts.length > 0 ? accounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </option>
                            )) : (
                              <option value="" disabled>Loading accounts...</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Entry Type
                          </label>
                          <select
                            value={entry.entry_type || 'debit'}
                            onChange={(e) => handleJournalEntryChange(index, 'entry_type', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={entry.amount || 0}
                            onChange={(e) => handleJournalEntryChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={entry.description || ''}
                              onChange={(e) => handleJournalEntryChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {editFormData.journal_entries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeJournalEntry(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiX size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 text-xs py-4">
                      No journal entries found. Click "Add Entry" to add one.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#E78D69' }}
                >
                  {editLoading ? 'Updating...' : 'Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountTransactions;