import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BASE_URL from '../../utils/api';

const BudgetRequest = () => {
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    boarding_house_id: '',
    month: '',
    year: new Date().getFullYear(),
    totalAmount: '',
    description: '',
    categories: [
      { name: 'Office Supplies', amount: '', description: '' },
      { name: 'Utilities', amount: '', description: '' },
      { name: 'Maintenance', amount: '', description: '' },
      { name: 'Marketing', amount: '', description: '' },
      { name: 'Other', amount: '', description: '' }
    ]
  });

  useEffect(() => {
    fetchBudgetRequests();
    fetchBoardingHouses();
  }, []);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`);
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

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
      setBudgetRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching budget requests:', error);
      toast.error('Failed to fetch budget requests');
      setBudgetRequests([]);
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

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index][field] = value;
    setFormData(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const calculateTotal = () => {
    return formData.categories.reduce((total, category) => {
      return total + (parseFloat(category.amount) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.boarding_house_id) {
      toast.error('Please select a boarding house');
      return;
    }
    
    if (!formData.month || !formData.year) {
      toast.error('Please select month and year');
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount === 0) {
      toast.error('Please add amounts to at least one category');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        boarding_house_id: parseInt(formData.boarding_house_id),
        month: formData.month,
        year: formData.year,
        totalAmount: totalAmount,
        description: formData.description,
        categories: formData.categories.filter(cat => cat.amount > 0)
      };

      let response;
      if (editingRequest) {
        response = await axios.put(`${BASE_URL}/budget-requests/${editingRequest.id}`, requestData, getAuthHeaders());
        setBudgetRequests(prev => prev.map(req => req.id === editingRequest.id ? response.data : req));
        toast.success('Budget request updated successfully');
      } else {
        response = await axios.post(`${BASE_URL}/budget-requests`, requestData, getAuthHeaders());
        setBudgetRequests(prev => [response.data, ...prev]);
        toast.success('Budget request submitted successfully');
      }
      
      setShowModal(false);
      setEditingRequest(null);
      resetForm();
    } catch (error) {
      console.error('Error submitting budget request:', error);
      toast.error(`Failed to submit budget request: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      boarding_house_id: '',
      month: '',
      year: new Date().getFullYear(),
      totalAmount: '',
      description: '',
      categories: [
        { name: 'Office Supplies', amount: '', description: '' },
        { name: 'Utilities', amount: '', description: '' },
        { name: 'Maintenance', amount: '', description: '' },
        { name: 'Marketing', amount: '', description: '' },
        { name: 'Other', amount: '', description: '' }
      ]
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
      month: request.month || '',
      year: request.year || new Date().getFullYear(),
      totalAmount: request.total_amount || '',
      description: request.description || '',
      categories: request.categories?.length > 0 ? request.categories.map(cat => ({
        name: cat.category_name || '',
        amount: cat.amount || '',
        description: cat.description || ''
      })) : [
        { name: 'Office Supplies', amount: '', description: '' },
        { name: 'Utilities', amount: '', description: '' },
        { name: 'Maintenance', amount: '', description: '' },
        { name: 'Marketing', amount: '', description: '' },
        { name: 'Other', amount: '', description: '' }
      ]
    });
    setShowModal(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this budget request?')) {
      try {
        setLoading(true);
        await axios.delete(`${BASE_URL}/budget-requests/${requestId}`, getAuthHeaders());
        setBudgetRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success('Budget request deleted successfully');
      } catch (error) {
        console.error('Error deleting budget request:', error);
        toast.error('Failed to delete budget request');
      } finally {
        setLoading(false);
      }
    }
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, { name: '', amount: '', description: '' }]
    }));
  };

  const removeCategory = (index) => {
    if (formData.categories.length > 1) {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter((_, i) => i !== index)
      }));
    }
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Budget Requests</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Submit and manage monthly budget requests
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block bg-[#E78D69] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
          >
            <PlusIcon className="inline-block h-4 w-4 mr-1" />
            Add Budget Request
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 flow-root">
        <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sm:pl-4">
                    Month/Year
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="animate-spin h-6 w-6 border-b-2 border-[#E78D69] mx-auto"></div>
                      <p className="text-gray-500 mt-2 text-xs">Loading budget requests...</p>
                    </td>
                  </tr>
                ) : budgetRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No budget requests yet</h3>
                      <p className="text-gray-500 text-xs mb-3">Get started by creating your first budget request</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#E78D69] hover:bg-[#E78D69]/90 text-white px-3 py-1.5 text-xs font-semibold"
                      >
                        <PlusIcon className="inline-block h-3 w-3 mr-1" />
                        Create Budget Request
                      </button>
                    </td>
                  </tr>
                ) : (
                  budgetRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pl-4 pr-3 text-sm text-gray-900 sm:pl-4">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                          <span className="text-xs font-medium">
                            {request.month} {request.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-900">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-xs font-semibold">
                            ${request.total_amount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-900">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-xs truncate">
                        {request.description || 'No description provided'}
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
      </div>

      {/* Budget Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {editingRequest ? 'Edit Budget Request' : 'New Budget Request'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingRequest ? 'Update your budget request' : 'Create a monthly budget request'}
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
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Month *
                      </label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                        required
                      >
                        <option value="">Select Month</option>
                        {months.map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2020"
                        max="2030"
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Amount
                      </label>
                      <div className="bg-white border border-gray-300 px-3 py-2">
                        <div className="text-sm font-semibold text-[#E78D69] flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          ${calculateTotal().toLocaleString()}
                        </div>
                      </div>
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
                      Budget Request Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent resize-none"
                      placeholder="Describe the purpose and details of this budget request..."
                    />
                  </div>
                </div>

                {/* Budget Categories */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-[#E78D69] mr-2" />
                      Budget Categories
                    </h3>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="text-xs font-medium text-[#E78D69] hover:text-[#E78D69]/80 flex items-center gap-1"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.categories.map((category, index) => (
                      <div key={index} className="bg-white border border-gray-200 p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-gray-600">Category {index + 1}</span>
                          {formData.categories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCategory(index)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Category Name *
                            </label>
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                              placeholder="e.g., Office Supplies"
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
                                value={category.amount}
                                onChange={(e) => handleCategoryChange(index, 'amount', e.target.value)}
                                className="w-full border border-gray-300 pl-7 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={category.description}
                              onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                              placeholder="Brief description"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#E78D69] text-white hover:bg-[#E78D69]/90 disabled:opacity-50 flex items-center gap-1"
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
                  <h2 className="text-base font-semibold text-gray-900">Budget Request Details</h2>
                  <p className="text-xs text-gray-500 mt-1">View budget request information</p>
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
                      <span className="font-medium text-gray-600">Boarding House:</span>
                      <p className="text-gray-900">{selectedRequest.boarding_house_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Month/Year:</span>
                      <p className="text-gray-900">{selectedRequest.month} {selectedRequest.year}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Total Amount:</span>
                      <p className="text-gray-900 font-semibold">${selectedRequest.total_amount?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900 mt-1">{selectedRequest.description || 'No description provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Budget Categories</h3>
                  {selectedRequest.categories && selectedRequest.categories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRequest.categories.map((category, index) => (
                        <div key={index} className="bg-white p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-medium text-gray-900">{category.category_name}</p>
                              {category.description && (
                                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-900">${category.amount?.toLocaleString() || '0'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No categories found</p>
                  )}
                </div>

                {/* Submission Info */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Submission Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Submitted By:</span>
                      <p className="text-gray-900">{selectedRequest.submitted_by_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submitted Date:</span>
                      <p className="text-gray-900">{selectedRequest.submitted_date ? new Date(selectedRequest.submitted_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    {selectedRequest.approved_by_name && (
                      <div>
                        <span className="font-medium text-gray-600">Approved By:</span>
                        <p className="text-gray-900">{selectedRequest.approved_by_name}</p>
                      </div>
                    )}
                    {selectedRequest.approved_date && (
                      <div>
                        <span className="font-medium text-gray-600">Approved Date:</span>
                        <p className="text-gray-900">{new Date(selectedRequest.approved_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedRequest.rejection_reason && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">Rejection Reason:</span>
                        <p className="text-gray-900 mt-1">{selectedRequest.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetRequest;
