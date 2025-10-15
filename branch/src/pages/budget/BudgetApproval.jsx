import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BASE_URL from '../../utils/api';

const BudgetApproval = () => {
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchBudgetRequests();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchBudgetRequests = async () => {
    try {
      setLoading(true);
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      const url = boardingHouseId 
        ? `${BASE_URL}/budget-requests?boarding_house_id=${boardingHouseId}`
        : `${BASE_URL}/budget-requests`;
      
      const response = await axios.get(url, getAuthHeaders());
      setBudgetRequests(response.data);
    } catch (error) {
      console.error('Error fetching budget requests:', error);
      toast.error('Failed to fetch budget requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/budget-requests/${requestId}/approve`, {}, getAuthHeaders());
      const updatedRequest = response.data;
      setBudgetRequests(prev => prev.map(request => 
        request.id === requestId ? updatedRequest : request
      ));
      toast.success('Budget request approved successfully');
    } catch (error) {
      console.error('Error approving budget request:', error);
      toast.error('Failed to approve budget request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId, reason) => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/budget-requests/${requestId}/reject`, { reason }, getAuthHeaders());
      const updatedRequest = response.data;
      setBudgetRequests(prev => prev.map(request => 
        request.id === requestId ? updatedRequest : request
      ));
      toast.success('Budget request rejected');
    } catch (error) {
      console.error('Error rejecting budget request:', error);
      toast.error('Failed to reject budget request');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        border: 'border-yellow-200',
        icon: ClockIcon
      },
      approved: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        icon: CheckCircleIcon
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        icon: XCircleIcon
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const filteredRequests = budgetRequests.filter(request => 
    filter === 'all' || request.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Approval</h1>
              <p className="text-gray-600">Review and approve budget requests from Business Analysts</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#E78D69] focus:border-transparent transition-colors duration-200"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      {/* Budget Requests Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {request.month} {request.year}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        ${request.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.submittedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewDetails(request)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 flex items-center disabled:opacity-50"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) handleReject(request.id, reason);
                            }}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 flex items-center disabled:opacity-50"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Budget Request Details - {selectedRequest.month} {selectedRequest.year}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Request Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Month/Year:</span>
                      <span className="font-medium">{selectedRequest.month} {selectedRequest.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">${selectedRequest.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted By:</span>
                      <span className="font-medium">{selectedRequest.submittedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted Date:</span>
                      <span className="font-medium">
                        {new Date(selectedRequest.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedRequest.approvedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved Date:</span>
                        <span className="font-medium">
                          {new Date(selectedRequest.approvedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedRequest.rejectedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rejected Date:</span>
                        <span className="font-medium">
                          {new Date(selectedRequest.rejectedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                  {selectedRequest.rejectionReason && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-red-600 mb-2">Rejection Reason:</h4>
                      <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Categories */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Categories</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedRequest.categories.map((category, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${category.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {category.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejection:');
                      if (reason) {
                        handleReject(selectedRequest.id, reason);
                        setShowDetailModal(false);
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailModal(false);
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BudgetApproval;
