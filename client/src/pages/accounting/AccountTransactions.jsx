import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCalendar, 
  FiFilter, 
  FiDownload,
  FiRefreshCw
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-xs">
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
    </div>
  );
};

export default AccountTransactions;