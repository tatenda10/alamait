import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaSync, 
  FaDownload,
  FaEye,
  FaUnlink,
  FaLink,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import BASE_URL from '../../context/Api';

const BankReconciliationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reconciliation, setReconciliation] = useState(null);
  const [bookItems, setBookItems] = useState([]);
  const [bankItems, setBankItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookItems, setSelectedBookItems] = useState([]);
  const [selectedBankItems, setSelectedBankItems] = useState([]);
  const [filters, setFilters] = useState({
    book_status: '',
    bank_status: '',
    amount_range: ''
  });

  useEffect(() => {
    if (id) {
      fetchReconciliationDetails();
    }
  }, [id]);

  const fetchReconciliationDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/bank-reconciliation/reconciliations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setReconciliation(response.data.reconciliation);
      setBookItems(response.data.items.book || []);
      setBankItems(response.data.items.bank || []);
    } catch (error) {
      console.error('Error fetching reconciliation details:', error);
      toast.error('Failed to fetch reconciliation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/api/bank-reconciliation/reconciliations/${id}/auto-match`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Auto-matched ${response.data.matches.length} transactions`);
      fetchReconciliationDetails(); // Refresh data
    } catch (error) {
      console.error('Error auto-matching:', error);
      toast.error('Failed to auto-match transactions');
    }
  };

  const handleManualMatch = async () => {
    if (selectedBookItems.length === 0 || selectedBankItems.length === 0) {
      toast.error('Please select both book and bank items to match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const matches = selectedBookItems.map(bookItem => ({
        book_item_id: bookItem.id,
        bank_item_id: selectedBankItems[0].id, // For now, match with first selected bank item
        notes: 'Manual match'
      }));

      await axios.put(`${BASE_URL}/api/bank-reconciliation/reconciliations/items`, {
        reconciliation_id: id,
        matches
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Items matched successfully');
      setSelectedBookItems([]);
      setSelectedBankItems([]);
      fetchReconciliationDetails();
    } catch (error) {
      console.error('Error matching items:', error);
      toast.error('Failed to match items');
    }
  };

  const handleBookItemSelect = (item) => {
    setSelectedBookItems(prev => {
      const isSelected = prev.find(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleBankItemSelect = (item) => {
    setSelectedBankItems(prev => {
      const isSelected = prev.find(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const isBookItemSelected = (item) => {
    return selectedBookItems.find(i => i.id === item.id);
  };

  const isBankItemSelected = (item) => {
    return selectedBankItems.find(i => i.id === item.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reconciled': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'unreconciled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredBookItems = bookItems.filter(item => {
    if (filters.book_status && item.is_reconciled !== (filters.book_status === 'reconciled')) {
      return false;
    }
    return true;
  });

  const filteredBankItems = bankItems.filter(item => {
    if (filters.bank_status && item.is_reconciled !== (filters.bank_status === 'reconciled')) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Reconciliation not found</h3>
        <button
          onClick={() => navigate('/dashboard/accounting/bank-reconciliation')}
          className="mt-4 text-[#E78D69] hover:text-[#E78D69]/80"
        >
          Back to Reconciliations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/accounting/bank-reconciliation')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
            <p className="text-gray-600">
              {reconciliation.account_name} - {new Date(reconciliation.reconciliation_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAutoMatch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FaSync className="mr-2" />
            Auto Match
          </button>
          <button
            onClick={handleManualMatch}
            disabled={selectedBookItems.length === 0 || selectedBankItems.length === 0}
            className="bg-[#E78D69] text-white px-4 py-2 rounded-lg hover:bg-[#E78D69]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaLink className="mr-2" />
            Match Selected
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Book Balance</h3>
          <p className="text-2xl font-bold text-gray-900">${parseFloat(reconciliation.book_balance).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Bank Balance</h3>
          <p className="text-2xl font-bold text-gray-900">${parseFloat(reconciliation.bank_balance).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Difference</h3>
          <p className={`text-2xl font-bold ${parseFloat(reconciliation.difference) === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(reconciliation.difference) > 0 ? '+' : ''}${parseFloat(reconciliation.difference).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reconciliation.status)}`}>
            {reconciliation.status}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book Items Status</label>
            <select
              value={filters.book_status}
              onChange={(e) => setFilters(prev => ({ ...prev, book_status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="reconciled">Reconciled</option>
              <option value="unreconciled">Unreconciled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Items Status</label>
            <select
              value={filters.bank_status}
              onChange={(e) => setFilters(prev => ({ ...prev, bank_status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="reconciled">Reconciled</option>
              <option value="unreconciled">Unreconciled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ book_status: '', bank_status: '', amount_range: '' })}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Book Items ({filteredBookItems.length})</h2>
            <p className="text-sm text-gray-600">Your internal transactions</p>
          </div>
          <div className="overflow-y-auto max-h-96">
            {filteredBookItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleBookItemSelect(item)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  isBookItemSelected(item) ? 'bg-blue-50 border-blue-200' : ''
                } ${item.is_reconciled ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(item.transaction_date).toLocaleDateString()}
                      </span>
                      {item.is_reconciled && (
                        <FaCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.transaction_reference}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.entry_type === 'debit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.entry_type === 'debit' ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.entry_type}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredBookItems.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No book items found
              </div>
            )}
          </div>
        </div>

        {/* Bank Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bank Items ({filteredBankItems.length})</h2>
            <p className="text-sm text-gray-600">Bank statement transactions</p>
          </div>
          <div className="overflow-y-auto max-h-96">
            {filteredBankItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleBankItemSelect(item)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  isBankItemSelected(item) ? 'bg-blue-50 border-blue-200' : ''
                } ${item.is_reconciled ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(item.bank_date).toLocaleDateString()}
                      </span>
                      {item.is_reconciled && (
                        <FaCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.bank_reference}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.entry_type === 'debit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.entry_type === 'debit' ? '-' : '+'}${parseFloat(item.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.entry_type}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredBankItems.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No bank items found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedBookItems.length > 0 || selectedBankItems.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Items</h3>
          <div className="flex space-x-4 text-sm">
            <span className="text-blue-700">
              Book Items: {selectedBookItems.length}
            </span>
            <span className="text-blue-700">
              Bank Items: {selectedBankItems.length}
            </span>
            <button
              onClick={() => {
                setSelectedBookItems([]);
                setSelectedBankItems([]);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliationDetail;
