import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BASE_URL from '../../utils/api';

const ExpenditureRequest = () => {
  const [expenditureRequests, setExpenditureRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    boarding_house_id: '',
    title: '',
    description: '',
    amount: '',
    category: '',
    priority: 'medium',
    expectedDate: '',
    vendor: '',
    justification: '',
    attachments: []
  });

  // Categories will now be populated from COA accounts

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchExpenditureRequests();
    fetchBoardingHouses();
    fetchCoaAccounts();
    fetchSuppliers();
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

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`);
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchCoaAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Use the main COA endpoint to get expense accounts directly
      const response = await axios.get(`${BASE_URL}/coa/type/Expense`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('COA Response:', response.data);
      
      // Get accounts from response.data.data
      const expenseAccounts = response.data.data || [];
      console.log('Expense Accounts:', expenseAccounts);
      setCoaAccounts(expenseAccounts);
    } catch (error) {
      console.error('Error fetching COA accounts:', error);
      toast.error('Failed to fetch COA accounts');
      setCoaAccounts([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/suppliers`);
      console.log('Suppliers Response:', response.data);
      
      // Suppliers API returns data directly
      const suppliers = Array.isArray(response.data) ? response.data : [];
      setSuppliers(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
      setSuppliers([]);
    }
  };

  const fetchExpenditureRequests = async () => {
    try {
      setLoading(true);
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      const url = boardingHouseId
        ? `${BASE_URL}/expenditure-requests?boarding_house_id=${boardingHouseId}`
        : `${BASE_URL}/expenditure-requests`;

      const response = await axios.get(url, getAuthHeaders());
      setExpenditureRequests(response.data);
    } catch (error) {
      console.error('Error fetching expenditure requests:', error);
      toast.error('Failed to fetch expenditure requests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.boarding_house_id) {
      toast.error('Please select a boarding house');
      return;
    }

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        boarding_house_id: parseInt(formData.boarding_house_id),
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        priority: formData.priority,
        expectedDate: formData.expectedDate,
        vendor: formData.vendor,
        justification: formData.justification
      };

      let response;
      if (editingRequest) {
        response = await axios.put(`${BASE_URL}/expenditure-requests/${editingRequest.id}`, requestData, getAuthHeaders());
        setExpenditureRequests(prev => prev.map(req => req.id === editingRequest.id ? response.data : req));
        toast.success('Expenditure request updated successfully');
      } else {
        response = await axios.post(`${BASE_URL}/expenditure-requests`, requestData, getAuthHeaders());
        setExpenditureRequests(prev => [response.data, ...prev]);
        toast.success('Expenditure request submitted successfully');
      }
      
      setShowModal(false);
      setEditingRequest(null);
      resetForm();
    } catch (error) {
      console.error('Error submitting expenditure request:', error);
      toast.error(`Failed to submit expenditure request: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      boarding_house_id: '',
      title: '',
      description: '',
      amount: '',
      category: '',
      priority: 'medium',
      expectedDate: '',
      vendor: '',
      justification: '',
      attachments: []
    });
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setFormData({
      boarding_house_id: request.boarding_house_id?.toString() || '',
      title: request.title || '',
      description: request.description || '',
      amount: request.amount || '',
      category: request.category || '',
      priority: request.priority || 'medium',
      expectedDate: request.expectedDate || '',
      vendor: request.vendor || '',
      justification: request.justification || '',
      attachments: []
    });
    setShowModal(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this expenditure request?')) {
      try {
        setLoading(true);
        await axios.delete(`${BASE_URL}/expenditure-requests/${requestId}`, getAuthHeaders());
        setExpenditureRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success('Expenditure request deleted successfully');
      } catch (error) {
        console.error('Error deleting expenditure request:', error);
        toast.error('Failed to delete expenditure request');
      } finally {
        setLoading(false);
      }
    }
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

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto mt-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-[#E78D69] mr-2" />
                  Expenditure Requests
                </h1>
                <p className="text-xs text-gray-500 mt-1">Submit and manage expenditure requests for approval</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#E78D69] text-white px-3 py-2 text-xs font-medium hover:bg-[#E78D69]/90 flex items-center gap-1"
              >
                <PlusIcon className="h-3 w-3" />
                New Request
              </button>
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
                    Expected Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                ) : expenditureRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center">
                      <div className="text-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No expenditure requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenditureRequests.map((request) => (
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
                        {request.expectedDate ? new Date(request.expectedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="relative py-2.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-4">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            onClick={() => handleViewRequest(request)}
                            className="text-[#E78D69] hover:text-[#E78D69]/80 p-1 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleEditRequest(request)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="Edit Request"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRequest(request.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Delete Request"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
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

      {/* Expenditure Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingRequest ? 'Edit Expenditure Request' : 'New Expenditure Request'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingRequest ? 'Update your expenditure request' : 'Create a new expenditure request'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRequest(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Boarding House Selection */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Boarding House Selection
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Boarding House *
                    </label>
                    <select
                      name="boarding_house_id"
                      value={formData.boarding_house_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      required
                    >
                      <option value="">Select Boarding House</option>
                      {boardingHouses.map((house) => (
                        <option key={house.id} value={house.id}>{house.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title and Amount */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Request Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                        placeholder="Brief title for the expenditure"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 pl-7 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category and Priority */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Category & Priority
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                        required
                      >
                        <option value="">Select Expense Account</option>
                        {coaAccounts && coaAccounts.length > 0 ? coaAccounts.map((account) => (
                          <option key={account.id} value={account.name}>
                            {account.name} ({account.code})
                          </option>
                        )) : (
                          <option value="" disabled>No expense accounts found</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Date
                      </label>
                      <input
                        type="date"
                        name="expectedDate"
                        value={formData.expectedDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Supplier
                      </label>
                      <select
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      >
                        <option value="">Select Supplier (Optional)</option>
                        {suppliers && suppliers.length > 0 ? suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </option>
                        )) : (
                          <option value="" disabled>No suppliers found</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Description
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      placeholder="Detailed description of the expenditure..."
                    />
                  </div>
                </div>

                {/* Justification */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Justification
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Justification
                    </label>
                    <textarea
                      name="justification"
                      value={formData.justification}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                      placeholder="Why is this expenditure necessary? How will it benefit the organization?"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRequest(null);
                      resetForm();
                    }}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-2 text-xs font-medium text-white bg-[#E78D69] hover:bg-[#E78D69]/90 disabled:opacity-50 flex items-center gap-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-3 w-3" />
                        {editingRequest ? 'Update Request' : 'Submit Request'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Expenditure Request Details</h2>
                  <p className="text-xs text-gray-500 mt-1">View expenditure request information</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900">{selectedRequest.title || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Amount:</span>
                      <p className="text-gray-900 font-semibold">${selectedRequest.amount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <p className="text-gray-900">{selectedRequest.category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Priority:</span>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Vendor:</span>
                      <p className="text-gray-900">{selectedRequest.vendor || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900 mt-1">{selectedRequest.description || 'No description provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Justification:</span>
                      <p className="text-gray-900 mt-1">{selectedRequest.justification || 'No justification provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Dates</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Expected Date:</span>
                      <p className="text-gray-900">{selectedRequest.expectedDate ? new Date(selectedRequest.expectedDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submitted Date:</span>
                      <p className="text-gray-900">{selectedRequest.submittedDate ? new Date(selectedRequest.submittedDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ExpenditureRequest;
