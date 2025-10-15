import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const AddAccountsPayableModal = ({ supplier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    supplier_id: supplier?.id || '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: '',
    expense_category: '',
    reference_number: '',
    notes: '',
    boarding_house_id: ''
  });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenseCategories();
    fetchSuppliers();
    fetchBoardingHouses();
  }, []);

  const fetchExpenseCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching expense categories...');
      const response = await axios.get(`${BASE_URL}/coa/type/Expense`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Expense categories response:', response.data);
      
      if (response.data && response.data.data) {
        setExpenseCategories(response.data.data || []);
        console.log('✅ Expense categories set:', response.data.data);
      } else {
        console.log('❌ No expense categories found in response');
        setExpenseCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching expense categories:', error);
      setExpenseCategories([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching suppliers...');
      const response = await axios.get(`${BASE_URL}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Suppliers response:', response.data);
      setSuppliers(response.data.data || []);
      console.log('✅ Suppliers set:', response.data.data);
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🏠 Fetching boarding houses...');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🏠 Boarding houses response:', response.data);
      setBoardingHouses(response.data || []);
      console.log('✅ Boarding houses set:', response.data);
      
      // Auto-select from localStorage if available
      const storedBoardingHouseId = localStorage.getItem('boarding_house_id');
      if (storedBoardingHouseId) {
        setFormData(prev => ({
          ...prev,
          boarding_house_id: storedBoardingHouseId
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching boarding houses:', error);
      setBoardingHouses([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Create accounts payable entry
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        boarding_house_id: parseInt(formData.boarding_house_id)
      };

      const response = await axios.post(`${BASE_URL}/accounts-payable`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to create accounts payable entry');
      }
    } catch (error) {
      console.error('Error creating accounts payable:', error);
      setError(error.response?.data?.message || 'Failed to create accounts payable entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Accounts Payable {supplier ? `- ${supplier.company}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs">
              {error}
            </div>
          )}

          {/* Supplier Selection (only show if no specific supplier) */}
          {!supplier && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select supplier (optional)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company} - {supplier.category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Boarding House Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Boarding House *
            </label>
            <select
              name="boarding_house_id"
              value={formData.boarding_house_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select boarding house</option>
              {boardingHouses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter invoice number (optional)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter reference number"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expense Category *
              </label>
              <select
                name="expense_category"
                value={formData.expense_category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {expenseCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.code} - {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter description of the expense"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <FaSave className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountsPayableModal;
