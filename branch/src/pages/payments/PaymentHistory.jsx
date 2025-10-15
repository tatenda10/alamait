import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import BASE_URL from '../../utils/api';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    // Filter payments based on search term and status
    let filtered = payments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/branch-payments/history`, getAuthHeaders());
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        icon: ClockIcon,
        label: 'Pending'
      },
      completed: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        icon: CheckCircleIcon,
        label: 'Completed'
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        icon: XCircleIcon,
        label: 'Rejected'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.bg} ${config.text} ring-current/20`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading payment history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Payment History</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            View all branch payment records and their status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, reference, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="mt-6">
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Payments ({filteredPayments.length})
            </h3>
          </div>
          
          {filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div className="font-medium">{payment.student_name}</div>
                        <div className="text-gray-500">{payment.student_phone}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {payment.reference_number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-[#E78D69] hover:text-[#E78D69]/80 p-1 rounded-full hover:bg-gray-100"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Student Info */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Student Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Name:</span>
                    <span className="text-xs font-medium">{selectedPayment.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Phone:</span>
                    <span className="text-xs font-medium">{selectedPayment.student_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Amount:</span>
                    <span className="text-xs font-medium">${parseFloat(selectedPayment.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Method:</span>
                    <span className="text-xs font-medium capitalize">{selectedPayment.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Date:</span>
                    <span className="text-xs font-medium">{formatDate(selectedPayment.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Reference:</span>
                    <span className="text-xs font-medium">{selectedPayment.reference_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Status:</span>
                    <span className="text-xs">{getStatusBadge(selectedPayment.status)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPayment.description && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-xs text-gray-700">{selectedPayment.description}</p>
                </div>
              )}

              {/* Receipt */}
              {selectedPayment.receipt_path && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Receipt</h3>
                  <a
                    href={`${BASE_URL}/uploads/${selectedPayment.receipt_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#E78D69] hover:text-[#E78D69]/80 underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}

              {/* Approval Info */}
              {selectedPayment.status === 'completed' && selectedPayment.approved_at && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-green-900 mb-2">Approval Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-green-600">Approved By:</span>
                      <span className="text-xs font-medium">{selectedPayment.approved_by_name || 'Admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-green-600">Approved At:</span>
                      <span className="text-xs font-medium">{formatDateTime(selectedPayment.approved_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Info */}
              {selectedPayment.status === 'rejected' && selectedPayment.rejected_at && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Rejection Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-red-600">Rejected By:</span>
                      <span className="text-xs font-medium">{selectedPayment.rejected_by_name || 'Admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-red-600">Rejected At:</span>
                      <span className="text-xs font-medium">{formatDateTime(selectedPayment.rejected_at)}</span>
                    </div>
                    {selectedPayment.rejection_reason && (
                      <div className="mt-2">
                        <span className="text-xs text-red-600">Reason:</span>
                        <p className="text-xs text-red-700 mt-1">{selectedPayment.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;