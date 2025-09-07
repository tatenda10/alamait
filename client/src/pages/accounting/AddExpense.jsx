import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const AddExpense = () => {
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
    payment_status: 'full', // 'full', 'debt', or 'partial'
    petty_cash_account_id: '',
    expense_category: '',
    partial_payment_amount: '',
    remaining_balance: '',
    remaining_payment_method: '' // For partial payments - how the remaining will be paid
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pettyCashAccounts, setPettyCashAccounts] = useState([]);
  const [selectedPettyCashBalance, setSelectedPettyCashBalance] = useState(0);
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
      // Ensure we always set an array, handle different response structures
      const suppliersData = response.data?.data || response.data || [];
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]); // Set empty array on error
    }
  };

  // Fetch petty cash account balance for the selected boarding house
  const fetchPettyCashAccounts = async () => {
    try {
      if (!formData.boarding_house_id) return;
      
      const response = await axios.get(`${BASE_URL}/petty-cash/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': formData.boarding_house_id
        }
      });
      
      const balance = Number(response.data?.current_balance || 0);
      setSelectedPettyCashBalance(balance);
      
      // Check if amount exceeds balance when petty cash is selected
      if (formData.payment_method === 'petty_cash' && formData.amount) {
        if (parseFloat(formData.amount) > balance) {
          setWarning(`Insufficient petty cash balance. Available: $${balance.toFixed(2)}`);
        } else {
          setWarning('');
        }
      }
    } catch (error) {
      console.error('Error fetching petty cash account:', error);
      setSelectedPettyCashBalance(0);
    }
  };

  // Check petty cash balance when payment method changes
  const handlePettyCashAccountChange = async (userId) => {
    // This function is no longer needed for the simplified system
    // Petty cash balance is automatically fetched when boarding house changes
  };

  // Check balance when amount changes
  const handleAmountChange = (amount) => {
    setFormData(prev => {
      const newFormData = { ...prev, amount };
      
      // If partial payment is selected, recalculate remaining balance
      if (prev.payment_status === 'partial' && prev.partial_payment_amount) {
        const partialAmount = parseFloat(prev.partial_payment_amount) || 0;
        const totalAmount = parseFloat(amount) || 0;
        const remaining = totalAmount - partialAmount;
        newFormData.remaining_balance = remaining > 0 ? remaining.toFixed(2) : '0.00';
      }
      
      return newFormData;
    });
    setWarning('');
    
    if (formData.payment_method === 'petty_cash' && amount) {
      if (parseFloat(amount) > selectedPettyCashBalance) {
        setWarning(`Insufficient petty cash balance. Available: $${selectedPettyCashBalance.toFixed(2)}`);
      } else {
        setWarning('');
      }
    }
  };

  useEffect(() => {
    fetchBoardingHouses();
    fetchSuppliers();
    
    // Try to fetch accounts with default boarding house ID if available
    const defaultBoardingHouseId = localStorage.getItem('boarding_house_id');
    if (defaultBoardingHouseId) {
      setFormData(prev => ({ ...prev, boarding_house_id: defaultBoardingHouseId }));
      // fetchPettyCashAccounts will be called by the boarding house useEffect
    }
  }, []);

  // Fetch accounts when boarding house changes
  useEffect(() => {
    if (formData.boarding_house_id) {
      fetchAccounts();
      fetchPettyCashAccounts(); // Also fetch petty cash accounts when boarding house changes
      fetchSuppliers(); // Also fetch suppliers filtered by boarding house
    }
  }, [formData.boarding_house_id]);

  // Generate auto reference number
  const generateReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Format: EXP-YYYYMMDD-HHMMSS
    return `EXP-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');

    // Clear payment method if payment status is debt
    if (formData.payment_status === 'debt') {
      setFormData(prev => ({ ...prev, payment_method: '' }));
    }

    // Validate partial payment
    if (formData.payment_status === 'partial') {
      const partialAmount = parseFloat(formData.partial_payment_amount) || 0;
      const totalAmount = parseFloat(formData.amount) || 0;
      
      if (partialAmount <= 0) {
        setError('Partial payment amount must be greater than 0');
        setLoading(false);
        return;
      }
      
      if (partialAmount >= totalAmount) {
        setError('Partial payment amount must be less than total amount');
        setLoading(false);
        return;
      }

      if (!formData.remaining_payment_method) {
        setError('Please select how the remaining balance will be paid');
        setLoading(false);
        return;
      }
    }

    // Validate petty cash balance if using petty cash
    if (formData.payment_method === 'petty_cash') {
      const amountToCheck = formData.payment_status === 'partial' 
        ? parseFloat(formData.partial_payment_amount) 
        : parseFloat(formData.amount);
        
      if (amountToCheck > selectedPettyCashBalance) {
        setError(`Insufficient petty cash balance. Available: $${selectedPettyCashBalance.toFixed(2)}`);
        setLoading(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      
      // Auto-generate reference number if not provided
      const referenceNumber = formData.reference_number || generateReferenceNumber();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'receipt' && formData[key]) {
          formDataToSend.append('receipt', formData[key]);
        } else if (key === 'reference_number') {
          // Always send the reference number (auto-generated if empty)
          formDataToSend.append('reference_number', referenceNumber);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // If payment status is debt, set payment method to credit
      if (formData.payment_status === 'debt') {
        formDataToSend.set('payment_method', 'credit');
      }

      // Regular expense creation (including petty cash expenses)
      const response = await axios.post(`${BASE_URL}/expenses`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success modal instead of navigating
      setSubmittedExpenseData({
        amount: formData.amount,
        description: formData.description,
        user: 'Current User', // You can get this from auth context if needed
        date: formData.expense_date,
        reference: formData.reference_number || generateReferenceNumber()
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      receipt: file
    }));
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setSubmittedExpenseData(null);
    // Reset form for adding another expense
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      payment_method: '',
      reference_number: '',
      expense_account_id: '',
      boarding_house_id: formData.boarding_house_id, // Keep boarding house
      notes: '',
      receipt: null,
      supplier_id: '',
      payment_status: 'full',
      petty_cash_account_id: '',
      expense_category: '',
      partial_payment_amount: '',
      remaining_balance: '',
      remaining_payment_method: ''
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Add New Expense</h1>
          <button
            onClick={() => navigate('/dashboard/expenses')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center">
            <FiAlertCircle className="mr-2" />
            {warning}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date*</label>
              <input
                type="date"
                required
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount*</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status*</label>
              <select
                required
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.payment_status}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
              >
                <option value="full">Paid in Full</option>
                <option value="debt">Debt (Account Payable)</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method{formData.payment_status === 'debt' ? ' (Not Required for Debt)' : '*'}
              </label>
              <select
                required={formData.payment_status !== 'debt'}
                disabled={formData.payment_status === 'debt'}
                className={`w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  formData.payment_status === 'debt' ? 'bg-gray-100 text-gray-500' : ''
                }`}
                value={formData.payment_status === 'debt' ? '' : formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
              >
                <option value="">
                  {formData.payment_status === 'debt' ? 'No payment required (Debt)' : 'Select payment method'}
                </option>
                {formData.payment_status !== 'debt' && (
                  <>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="petty_cash">Petty Cash</option>
                  </>
                )}
              </select>
            </div>

            {formData.payment_method === 'petty_cash' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Petty Cash Account</label>
                <div className="text-xs text-gray-600 p-2 bg-gray-50 border border-gray-200">
                  <p>Petty cash will be deducted from the boarding house's petty cash account.</p>
                  <p className="mt-1">Current Balance: ${selectedPettyCashBalance.toFixed(2)}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Leave empty to auto-generate (EXP-YYYYMMDD-HHMMSS)"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reference_number: generateReferenceNumber() }))}
                  className="px-3 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                >
                  Auto
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Click "Auto" button to generate a unique reference number, or leave empty to auto-generate on submit
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expense Account*</label>
              <select
                required
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.expense_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_account_id: e.target.value }))}
              >
                <option value="">Select expense account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Boarding House*</label>
              <select
                required
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.boarding_house_id}
                onChange={(e) => setFormData(prev => ({ ...prev, boarding_house_id: e.target.value }))}
              >
                <option value="">Select boarding house</option>
                {boardingHouses.map(bh => (
                  <option key={bh.id} value={bh.id}>
                    {bh.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier (Optional)</label>
              <select
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.supplier_id}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
              >
                <option value="">Select supplier (optional)</option>
                {Array.isArray(suppliers) && suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name || supplier.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expense Category</label>
              <select
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.expense_category}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_category: e.target.value }))}
              >
                <option value="">Select category (optional)</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Transportation">Transportation</option>
                <option value="Communication">Communication</option>
                <option value="General">General</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.payment_status === 'partial' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Partial Payment Amount*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.partial_payment_amount}
                    onChange={(e) => {
                      const partialAmount = parseFloat(e.target.value) || 0;
                      const totalAmount = parseFloat(formData.amount) || 0;
                      const remaining = totalAmount - partialAmount;
                      setFormData(prev => ({ 
                        ...prev, 
                        partial_payment_amount: e.target.value,
                        remaining_balance: remaining > 0 ? remaining.toFixed(2) : '0.00'
                      }));
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remaining Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    className="w-full text-xs border border-gray-200 px-3 py-2 bg-gray-50 text-gray-600"
                    value={formData.remaining_balance}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remaining Balance Payment Method*</label>
                  <select
                    required
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.remaining_payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, remaining_payment_method: e.target.value }))}
                  >
                    <option value="">How will the remaining balance be paid?</option>
                    <option value="cash">Cash (Later)</option>
                    <option value="bank_transfer">Bank Transfer (Later)</option>
                    <option value="check">Check (Later)</option>
                    <option value="petty_cash">Petty Cash (Later)</option>
                    <option value="credit">Credit (Account Payable)</option>
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description*</label>
              <textarea
                required
                rows={3}
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter expense description"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter additional notes"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Receipt</label>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: JPEG, PNG, PDF (max 5MB)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/expenses')}
              className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedExpenseData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
                      {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Expense Created Successfully!
        </h3>
        
        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          Your expense has been successfully recorded in the system.
        </p>
        
        {/* Expense Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <FiCheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Expense Details
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">${parseFloat(submittedExpenseData.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{submittedExpenseData.date}</span>
            </div>
            {submittedExpenseData.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium">{submittedExpenseData.reference}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-600">Description:</span>
              <p className="font-medium mt-1">{submittedExpenseData.description}</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleModalClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;