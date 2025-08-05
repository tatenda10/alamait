import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const AddExpense = () => {
  const navigate = useNavigate();
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    payment_method: 'cash',
    reference_number: '',
    expense_account_id: '',
    notes: '',
    boarding_house_id: localStorage.getItem('boarding_house_id')
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchExpenseAccounts();
  }, []);

  const fetchExpenseAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'boarding-house-id': localStorage.getItem('boarding_house_id')
        }
      });
      // Filter only expense accounts
      const expenseAccts = response.data.data.filter(account => account.type === 'Expense');
      setExpenseAccounts(expenseAccts);
    } catch (error) {
      console.error('Error fetching expense accounts:', error);
      setError('Failed to load expense accounts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Append all form fields including boarding_house_id
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });

      // Append receipt if exists
      if (receipt) {
        formData.append('receipt', receipt);
      }

      // Log request data
      console.log('Request Headers:', {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'boarding-house-id': localStorage.getItem('boarding_house_id')
      });
      console.log('Form Data:', Object.fromEntries(formData.entries()));

      await axios.post(`${BASE_URL}/expenses`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset form and show success modal
      setForm({
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        payment_method: 'cash',
        reference_number: '',
        expense_account_id: '',
        notes: '',
        boarding_house_id: localStorage.getItem('boarding_house_id')
      });
      setReceipt(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding expense:', error);
      setError(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should not exceed 5MB');
        return;
      }
      setReceipt(file);
      setError(null);
    }
  };

  return (
    <div className="px-4 mt-10 sm:px-6 lg:px-8 py-8 w-full">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Expense Added Successfully
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        The expense has been recorded successfully.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center bg-[#E78D69] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
                    onClick={() => {
                      setShowSuccessModal(false);
                    }}
                  >
                    Add Another Expense
                  </button>
                  <button
                    type="button"
                    className="mt-2 inline-flex w-full justify-center px-3 py-2 text-sm font-semibold text-gray-900"
                    onClick={() => navigate('/dashboard/expenses/list')}
                  >
                    Go to Expenses List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Add New Expense</h1>
          <p className="mt-2 text-sm text-gray-700">
            Record a new expense with details and proper account categorization.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 w-full">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <div>
              <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  name="expense_date"
                  id="expense_date"
                  required
                  value={form.expense_date}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="description"
                id="description"
                required
                value={form.description}
                onChange={handleInputChange}
                className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                placeholder="Enter expense description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <select
                  name="payment_method"
                  id="payment_method"
                  required
                  value={form.payment_method}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="expense_account_id" className="block text-sm font-medium text-gray-700">
                Expense Account <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <select
                  name="expense_account_id"
                  id="expense_account_id"
                  required
                  value={form.expense_account_id}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                >
                  <option value="">Select an account</option>
                  {expenseAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700">
              Reference Number
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="reference_number"
                id="reference_number"
                value={form.reference_number}
                onChange={handleInputChange}
                className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                placeholder="Enter reference number (optional)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
              Receipt Upload
            </label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="receipt" className="flex flex-col items-center justify-center w-full h-32 border border-gray-200 border-dashed cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG or JPEG (max. 5MB)</p>
                  </div>
                  <input
                    id="receipt"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {receipt && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {receipt.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <div className="mt-2">
              <textarea
                name="notes"
                id="notes"
                rows={3}
                value={form.notes}
                onChange={handleInputChange}
                className="block w-full px-4 py-2.5 text-gray-900 border border-gray-200 focus:ring-2 focus:ring-inset focus:ring-[#E78D69]"
                placeholder="Add any additional notes (optional)"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-x-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard/expenses/list')}
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#E78D69] text-sm font-semibold text-white shadow-sm hover:bg-[#E78D69]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E78D69] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense; 