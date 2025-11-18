import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PaperClipIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BASE_URL from '../../utils/api';

const ExpenditureApproval = () => {
  const [expenditureRequests, setExpenditureRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, actioned
  const [receiptFile, setReceiptFile] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchExpenditureRequests();
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

  const fetchExpenditureRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/expenditure-requests`, getAuthHeaders());
      setExpenditureRequests(response.data);
    } catch (error) {
      console.error('Error fetching expenditure requests:', error);
      toast.error('Failed to fetch expenditure requests');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExpenditure = async (requestId) => {
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }
      
      // Get auth headers
      const token = localStorage.getItem('token');
      
      // For FormData, don't set Content-Type - let axios/browser set it automatically with boundary
      const response = await axios.post(
        `${BASE_URL}/expenditure-requests/${requestId}/confirm`, 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData - browser/axios will set it with boundary
          }
        }
      );
      
      // Refresh the list to get updated status
      await fetchExpenditureRequests();
      
      // Close confirm modal and show success modal
      setShowConfirmModal(false);
      setReceiptFile(null);
      
      // Set success data
      setSuccessData({
        title: selectedRequest.title,
        amount: selectedRequest.amount,
        category: selectedRequest.category
      });
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error confirming expenditure:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Close confirm modal
      setShowConfirmModal(false);
      setReceiptFile(null);
      
      // Extract error message from response
      let errorMessage = 'Failed to confirm expenditure';
      let currentBalance = null;
      let requiredAmount = null;
      let accountName = 'Petty Cash';
      
      if (error.response?.data) {
        // Check for different error formats
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        
        // Extract balance information if available
        if (error.response.data.currentBalance !== undefined) {
          currentBalance = error.response.data.currentBalance;
          requiredAmount = error.response.data.requiredAmount || 0;
          accountName = error.response.data.accountName || 'Petty Cash';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Set error data
      setErrorData({
        message: errorMessage,
        currentBalance,
        requiredAmount,
        accountName,
        title: selectedRequest?.title,
        amount: selectedRequest?.amount
      });
      
      // Show error modal
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (request) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setReceiptFile(file);
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
        icon: ClockIcon,
        label: 'Pending' 
      },
      approved: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        icon: CheckCircleIcon,
        label: 'Approved' 
      },
      actioned: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        icon: CheckCircleIcon,
        label: 'Actioned' 
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
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { bg: 'bg-green-50', text: 'text-green-700', label: 'Low' },
      medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medium' },
      high: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'High' },
      urgent: { bg: 'bg-red-50', text: 'text-red-700', label: 'Urgent' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredRequests = expenditureRequests.filter(request => 
    filter === 'all' || request.status === filter
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto mt-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-[#E78D69] mr-2" />
                  Expenditure Approval
                </h1>
                <p className="text-xs text-gray-500 mt-1">Review and approve expenditure requests from branch administrators</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                  >
                    <option value="all">All Requests</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="actioned">Actioned</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenditure Requests Table */}
        <div className="bg-white border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin h-5 w-5 border-b-2 border-[#E78D69]"></div>
                        <span className="ml-2 text-xs text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center">
                      <div className="text-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No expenditure requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-xs font-medium text-gray-900">{request.title}</div>
                            <div className="text-xs text-gray-500">{request.vendor || 'No vendor'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-xs font-semibold">
                            ${request.amount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {request.category}
                      </td>
                      <td className="px-3 py-2.5">
                        {getPriorityBadge(request.priority)}
                      </td>
                      <td className="px-3 py-2.5">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {request.submitted_by_name || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {request.submitted_date ? new Date(request.submitted_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="relative py-2.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-4">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => viewDetails(request)}
                            className="text-[#E78D69] hover:text-[#E78D69]/80 p-1 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {request.status === 'approved' && (
                            <button
                              onClick={() => openConfirmModal(request)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded disabled:opacity-50"
                              title="Confirm Expenditure"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
        </div>
      </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-[#E78D69] mr-2" />
                    Expenditure Request Details
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Request Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Request Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Title:</span>
                        <span className="text-xs font-medium">{selectedRequest.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Amount:</span>
                        <span className="text-xs font-medium">${selectedRequest.amount?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Category:</span>
                        <span className="text-xs font-medium">{selectedRequest.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Priority:</span>
                        {getPriorityBadge(selectedRequest.priority)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Status:</span>
                        {getStatusBadge(selectedRequest.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Vendor:</span>
                        <span className="text-xs font-medium">{selectedRequest.vendor || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Submitted By:</span>
                        <span className="text-xs font-medium">{selectedRequest.submitted_by_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Submitted Date:</span>
                        <span className="text-xs font-medium">
                          {selectedRequest.submitted_date ? new Date(selectedRequest.submitted_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Expected Date:</span>
                        <span className="text-xs font-medium">
                          {selectedRequest.expected_date ? new Date(selectedRequest.expected_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {selectedRequest.approved_date && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Approved Date:</span>
                          <span className="text-xs font-medium">
                            {new Date(selectedRequest.approved_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedRequest.rejected_date && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Rejected Date:</span>
                          <span className="text-xs font-medium">
                            {new Date(selectedRequest.rejected_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description and Justification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Description
                    </h3>
                    <p className="text-xs text-gray-600 bg-white border border-gray-200 p-2">
                      {selectedRequest.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Justification
                    </h3>
                    <p className="text-xs text-gray-600 bg-white border border-gray-200 p-2">
                      {selectedRequest.justification || 'No justification provided'}
                    </p>
                  </div>
                </div>

                {/* Rejection Reason */}
                {selectedRequest.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 p-3">
                    <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center">
                      <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                      Rejection Reason
                    </h3>
                    <p className="text-xs text-red-600 bg-white border border-red-200 p-2">
                      {selectedRequest.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {selectedRequest.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border border-gray-200 p-2">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-700">{attachment.file_name}</span>
                          </div>
                          <button className="text-[#E78D69] hover:text-[#E78D69]/80 text-xs">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedRequest.status === 'approved' && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        openConfirmModal(selectedRequest);
                        setShowDetailModal(false);
                      }}
                      disabled={loading}
                      className="px-3 py-2 text-xs font-medium text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Confirm Expenditure
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Expenditure Modal */}
        {showConfirmModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 w-full max-w-md">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    Confirm Expenditure
                  </h2>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setReceiptFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Request Summary */}
                <div className="bg-gray-50 border border-gray-200 p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Expenditure Details</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Title:</span>
                      <span className="text-xs font-medium">{selectedRequest.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Amount:</span>
                      <span className="text-xs font-medium">${selectedRequest.amount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Category:</span>
                      <span className="text-xs font-medium">{selectedRequest.category}</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Upload Receipt (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="receipt-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-[#E78D69] hover:text-[#E78D69]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#E78D69]"
                        >
                          <span>Upload a file</span>
                          <input
                            id="receipt-upload"
                            name="receipt-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                  {receiptFile && (
                    <div className="mt-2 flex items-center text-xs text-gray-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      {receiptFile.name}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setReceiptFile(null);
                    }}
                    disabled={loading}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmExpenditure(selectedRequest.id)}
                    disabled={loading}
                    className="px-3 py-2 text-xs font-medium text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Confirming...' : 'Confirm Expenditure'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        <Transition appear show={showSuccessModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowSuccessModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 text-center mb-2">
                      Expenditure Confirmed Successfully
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-600 text-center">
                        The expenditure has been confirmed and added to expenses.
                      </p>
                      
                      {successData && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Title:</span>
                            <span className="text-xs font-medium text-gray-900">{successData.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Amount:</span>
                            <span className="text-xs font-medium text-gray-900">${parseFloat(successData.amount || 0).toFixed(2)}</span>
                          </div>
                          {successData.category && (
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Category:</span>
                              <span className="text-xs font-medium text-gray-900">{successData.category}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                        onClick={() => {
                          setShowSuccessModal(false);
                          setSuccessData(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Error Modal */}
        <Transition appear show={showErrorModal} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowErrorModal(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircleIcon className="h-10 w-10 text-red-600" />
                      </div>
                    </div>
                    
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 text-center mb-2">
                      Unable to Confirm Expenditure
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-2">
                      {errorData?.currentBalance !== null && errorData?.currentBalance !== undefined ? (
                        <>
                          <p className="text-sm text-gray-600 text-center font-medium text-red-600">
                            Insufficient {errorData.accountName} Balance
                          </p>
                          <div className="bg-red-50 rounded-lg p-4 mt-4 space-y-3 border border-red-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">Current Balance:</span>
                              <span className="text-sm font-semibold text-gray-900">${parseFloat(errorData.currentBalance || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">Required Amount:</span>
                              <span className="text-sm font-semibold text-red-600">${parseFloat(errorData.requiredAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-red-200">
                              <span className="text-sm font-medium text-gray-700">Shortfall:</span>
                              <span className="text-sm font-bold text-red-600">
                                ${(parseFloat(errorData.requiredAmount || 0) - parseFloat(errorData.currentBalance || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {errorData.title && (
                            <div className="bg-gray-50 rounded-lg p-3 mt-3">
                              <div className="text-xs text-gray-600 mb-1">Expenditure Request:</div>
                              <div className="text-sm font-medium text-gray-900">{errorData.title}</div>
                              {errorData.amount && (
                                <div className="text-xs text-gray-600 mt-1">Amount: ${parseFloat(errorData.amount).toFixed(2)}</div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 text-center mt-3">
                            Please add more funds to the petty cash account before confirming this expenditure.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 text-center">
                          {errorData?.message || 'An error occurred while confirming the expenditure.'}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                        onClick={() => {
                          setShowErrorModal(false);
                          setErrorData(null);
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default ExpenditureApproval;
