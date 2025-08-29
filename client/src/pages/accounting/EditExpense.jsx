import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const EditExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    payment_method: '',
    reference_number: '',
    expense_account_id: '',
    boarding_house_id: '',
    notes: '',
    receipt: null,
    supplier_id: '',
    payment_status: 'full',
    // Removed petty_cash_account_id as we use simplified petty cash system
    expense_category: '',
    partial_payment_amount: '',
    remaining_balance: '',
    remaining_payment_method: ''
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  // Removed petty cash accounts state as we use simplified petty cash system
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedExpenseData, setSubmittedExpenseData] = useState(null);

  // Fetch expense accounts
  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': formData.boarding_house_id || localStorage.getItem('boarding_house_id') || '1'
        }
      });
      // Filter only expense accounts - flatten the hierarchical structure first
      const flattenAccounts = (accounts) => {
        let result = [];
        accounts.forEach(account => {
          result.push(account);
          if (account.children && account.children.length > 0) {
            result = result.concat(flattenAccounts(account.children));
          }
        });
        return result;
      };
      
      const allAccounts = flattenAccounts(response.data.data || []);
      const expenseAccounts = allAccounts.filter(account => 
        account.type === 'Expense' && !account.is_category
      );
      setAccounts(expenseAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const boardingHouseId = formData.boarding_house_id || localStorage.getItem('boarding_house_id');
      const url = boardingHouseId 
        ? `${BASE_URL}/suppliers?boarding_house_id=${boardingHouseId}`
        : `${BASE_URL}/suppliers`;
        
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuppliers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };



  // Fetch expense details
  const fetchExpense = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/expenses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const expense = response.data;
      console.log('Fetched expense:', expense);
      
      setFormData({
        expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: expense.amount || '',
        description: expense.description || '',
        payment_method: expense.payment_method || '',
        reference_number: expense.reference_number || '',
        expense_account_id: expense.expense_account_id || '',
        boarding_house_id: expense.boarding_house_id || localStorage.getItem('boarding_house_id') || '',
        notes: expense.notes || '',
        receipt: null,
        supplier_id: expense.supplier_id || '',
        payment_status: expense.payment_status || 'full',
        // Removed petty_cash_account_id as we use simplified petty cash system
        expense_category: expense.expense_category || '',
        partial_payment_amount: expense.partial_payment_amount || '',
        remaining_balance: expense.remaining_balance || '',
        remaining_payment_method: expense.remaining_payment_method || ''
      });
      setInitialLoading(false);
    } catch (error) {
      console.error('Error fetching expense:', error);
      setError('Failed to load expense details');
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      const loadData = async () => {
        try {
          setInitialLoading(true);
          await Promise.all([
            fetchExpense(),
            fetchAccounts(),
            fetchBoardingHouses(),
            fetchSuppliers()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
          setError('Failed to load expense data');
        } finally {
          setInitialLoading(false);
        }
      };
      
      loadData();
    }
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (key === 'receipt' && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else if (key !== 'receipt') {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Ensure boarding_house_id is included
      if (!formDataToSend.get('boarding_house_id')) {
        formDataToSend.append('boarding_house_id', formData.boarding_house_id || localStorage.getItem('boarding_house_id') || '1');
      }

      const response = await axios.put(`${BASE_URL}/expenses/${id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        setShowSuccessModal(true);
        setSubmittedExpenseData(response.data);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      setError(error.response?.data?.message || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, receipt: file }));
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/dashboard/expenses');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
            <p className="text-sm text-gray-500">Update expense details</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Warning Message */}
        {warning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200">
            <div className="flex">
              <FiClock className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    placeholder="Enter expense description"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="petty_cash">Petty Cash</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    placeholder="Enter reference number"
                  />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Account *
                  </label>
                  <select
                    value={formData.expense_account_id}
                    onChange={(e) => setFormData({ ...formData, expense_account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    required
                  >
                    <option value="">Select expense account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boarding House
                  </label>
                  <select
                    value={formData.boarding_house_id}
                    onChange={(e) => setFormData({ ...formData, boarding_house_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                  >
                    <option value="">Select boarding house</option>
                    {boardingHouses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.name} - {house.location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company} - {supplier.contact_person}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                    accept="image/*,.pdf"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
                  placeholder="Enter additional notes"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/expenses')}
                className="px-6 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#E78D69] border border-transparent text-sm font-medium text-white hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-green-100">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Expense Updated Successfully</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  The expense has been updated successfully.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-[#E78D69] text-white text-base font-medium w-full shadow-sm hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExpense; 