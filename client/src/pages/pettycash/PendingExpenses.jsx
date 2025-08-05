import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiEye, FiClock, FiDollarSign, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import BASE_URL from '../../context/Api';

const PendingExpenses = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [actionNotes, setActionNotes] = useState('');
  const [filter, setFilter] = useState('pending');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchPendingExpenses();
  }, [filter, pagination.page]);

  const fetchPendingExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/pending-petty-cash/pending-expenses`, {
        params: {
          status: filter,
          page: pagination.page,
          limit: pagination.limit
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setPendingExpenses(response.data.data.expenses);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
      toast.error('Failed to fetch pending expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedExpense || !actionType) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = actionType === 'approve' 
        ? `/pending-petty-cash/pending-expenses/${selectedExpense.id}/approve`
        : `/pending-petty-cash/pending-expenses/${selectedExpense.id}/reject`;

      const payload = actionType === 'approve' 
        ? { notes: actionNotes }
        : { rejection_reason: actionNotes };

      // Debug logging
      console.log('=== EXPENSE APPROVAL DEBUG ===');
      console.log('Selected Expense:', selectedExpense);
      console.log('Action Type:', actionType);
      console.log('Expense ID:', selectedExpense.id);
      console.log('Full URL:', `${BASE_URL}${endpoint}`);
      console.log('Payload being sent:', payload);
      console.log('Token present:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('Headers:', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response received:', response);
      console.log('Response data:', response.data);

      if (response.data.success) {
        toast.success(`Expense ${actionType}d successfully`);
        setShowModal(false);
        setSelectedExpense(null);
        setActionNotes('');
        setActionType('');
        fetchPendingExpenses();
      }
    } catch (error) {
      console.error(`Error ${actionType}ing expense:`, error);
      console.log('=== ERROR DETAILS ===');
      console.log('Error message:', error.message);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      console.log('Error response status:', error.response?.status);
      console.log('Error response headers:', error.response?.headers);
      console.log('Error config:', error.config);
      console.log('Request URL:', error.config?.url);
      console.log('Request method:', error.config?.method);
      console.log('Request data:', error.config?.data);
      console.log('Request headers:', error.config?.headers);
      toast.error(error.response?.data?.message || `Failed to ${actionType} expense`);
    }
  };

  const openActionModal = (expense, type) => {
    setSelectedExpense(expense);
    setActionType(type);
    setActionNotes('');
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'approved':
        return 'text-green-700 bg-green-100';
      case 'rejected':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-800 mb-1">Pending Petty Cash Expenses</h1>
          <p className="text-sm text-gray-600">Review and approve petty cash expense requests</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white border border-gray-200">
        {pendingExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No {filter} expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.full_name || expense.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {expense.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{expense.description}</div>
                      {expense.vendor_name && (
                        <div className="text-xs text-gray-500">Vendor: {expense.vendor_name}</div>
                      )}
                      {expense.category && (
                        <div className="text-xs text-gray-500">Category: {expense.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FiDollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          ${Number(expense.amount).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FiCalendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {formatDate(expense.submitted_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {expense.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(expense, 'approve')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openActionModal(expense, 'reject')}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowModal(true);
                            setActionType('view');
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-xs border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-xs border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {actionType === 'view' ? 'Expense Details' : 
               actionType === 'approve' ? 'Approve Expense' : 'Reject Expense'}
            </h3>
            
            {/* Expense Details */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-medium text-gray-500">User</label>
                <p className="text-sm text-gray-900">{selectedExpense.full_name || selectedExpense.username}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Amount</label>
                <p className="text-sm text-gray-900">${Number(selectedExpense.amount).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{selectedExpense.description}</p>
              </div>
              {selectedExpense.vendor_name && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Vendor</label>
                  <p className="text-sm text-gray-900">{selectedExpense.vendor_name}</p>
                </div>
              )}
              {selectedExpense.notes && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900">{selectedExpense.notes}</p>
                </div>
              )}
              {selectedExpense.rejection_reason && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Rejection Reason</label>
                  <p className="text-sm text-red-600">{selectedExpense.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Action Input */}
            {actionType !== 'view' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  placeholder={actionType === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'}
                  required={actionType === 'reject'}
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedExpense(null);
                  setActionNotes('');
                  setActionType('');
                }}
                className="px-4 py-2 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {actionType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {actionType !== 'view' && (
                <button
                  onClick={handleAction}
                  disabled={actionType === 'reject' && !actionNotes.trim()}
                  className={`px-4 py-2 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingExpenses;