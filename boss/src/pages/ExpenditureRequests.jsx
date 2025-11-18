import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';
import { toast } from 'react-toastify';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ExpenditureRequests = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenditureRequests();
  }, []);

  const fetchExpenditureRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/expenditure-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching expenditure requests:', error);
      toast.error('Failed to fetch expenditure requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.post(`${BASE_URL}/expenditure-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Expenditure request approved successfully');
      fetchExpenditureRequests();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve expenditure request');
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      if (!reason || !reason.trim()) {
        toast.error('Please provide a rejection reason');
        return;
      }
      
      await axios.post(`${BASE_URL}/expenditure-requests/${requestId}/reject`, 
        { rejection_reason: reason }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Expenditure request rejected');
      fetchExpenditureRequests();
      setShowModal(false);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject expenditure request');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      actioned: { color: 'bg-blue-100 text-blue-800', text: 'Actioned' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58020]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Expenditure Requests</h1>
          <p className="mt-0.5 text-xs text-gray-500">Review and approve expenditure requests from branch users</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-3 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  filter === 'all'
                    ? 'bg-[#f58020] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  filter === 'pending'
                    ? 'bg-[#f58020] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({requests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  filter === 'approved'
                    ? 'bg-[#f58020] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({requests.filter(r => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  filter === 'rejected'
                    ? 'bg-[#f58020] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({requests.filter(r => r.status === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-gray-200">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-gray-500">
                {filter === 'all' 
                  ? 'No expenditure requests have been submitted yet.'
                  : `No ${filter} expenditure requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Request Details
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted By
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {request.title || 'Expenditure Request'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {request.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {formatCurrency(request.amount)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-900">
                          {request.submitted_by_name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.boarding_house_name || 'Unknown Boarding House'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="text-[#f58020] hover:text-[#e6701a] flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Details Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Expenditure Request Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-xs text-gray-900">{selectedRequest.title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                    <p className="text-xs text-gray-900 font-medium">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Request Date</label>
                    <p className="text-xs text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Submitted By</label>
                    <p className="text-xs text-gray-900">{selectedRequest.submitted_by_name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Boarding House</label>
                    <p className="text-xs text-gray-900">{selectedRequest.boarding_house_name || 'Unknown'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-xs text-gray-900">{selectedRequest.description || 'No description provided'}</p>
                </div>

                {selectedRequest.justification && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Justification</label>
                    <p className="text-xs text-gray-900">{selectedRequest.justification}</p>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rejection Reason</label>
                    <p className="text-xs text-red-600">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => openRejectModal(selectedRequest)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-red-300 text-red-700 bg-white hover:bg-red-50"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-4 border w-96 bg-white">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Reject Expenditure Request
              </h3>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300"
                  placeholder="Please provide a reason for rejecting this request..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpenditureRequests;

