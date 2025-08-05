import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AddExpense = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const BASE_URL = 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    payment_method: 'petty_cash',
    reference_number: '',
    expense_account_id: '',
    boarding_house_id: '',
    notes: '',
    receipt: null,
    supplier_id: '',
    payment_status: 'full', // 'full', 'debt', or 'partial'
    petty_cash_account_id: '',
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

  // Format currency as USD
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

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

  // Fetch petty cash users (accounts)
  const fetchPettyCashAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const users = response.data.users || [];
      setPettyCashAccounts(users);
      
      // Automatically select the logged-in user if available
      if (user && users.length > 0) {
        const currentUser = users.find(u => 
          u.username === user.username || 
          u.email === user.email || 
          u.id === user.id
        );
        
        if (currentUser) {
          setFormData(prev => ({ ...prev, petty_cash_account_id: currentUser.id.toString() }));
          // Also fetch the balance for the current user
          handlePettyCashAccountChange(currentUser.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching petty cash users:', error);
      setPettyCashAccounts([]);
    }
  };

  // Check petty cash balance when user is selected
  const handlePettyCashAccountChange = async (userId) => {
    setFormData(prev => ({ ...prev, petty_cash_account_id: userId }));
    setWarning('');
    
    if (userId) {
      try {
        const response = await axios.get(`${BASE_URL}/petty-cash-admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const balance = Number(response.data.data?.current_balance || response.data.user?.current_balance || 0);
        setSelectedPettyCashBalance(balance);
        
        // Check if amount exceeds balance
        if (formData.amount && parseFloat(formData.amount) > balance) {
          setWarning(`Insufficient petty cash balance. Available: ${formatCurrency(balance)}`);
        }
      } catch (error) {
        console.error('Error fetching petty cash balance:', error);
      }
    } else {
      setSelectedPettyCashBalance(0);
    }
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
    
    if (formData.payment_method === 'petty_cash' && formData.petty_cash_account_id && amount) {
      if (parseFloat(amount) > selectedPettyCashBalance) {
        setWarning(`Insufficient petty cash balance. Available: ${formatCurrency(selectedPettyCashBalance)}`);
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
    if (formData.payment_method === 'petty_cash' && formData.petty_cash_account_id) {
      const amountToCheck = formData.payment_status === 'partial' 
        ? parseFloat(formData.partial_payment_amount) 
        : parseFloat(formData.amount);
        
      if (amountToCheck > selectedPettyCashBalance) {
        setError(`Insufficient petty cash balance. Available: ${formatCurrency(selectedPettyCashBalance)}`);
        setLoading(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'receipt' && formData[key]) {
          formDataToSend.append('receipt', formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // If payment status is debt, set payment method to credit
      if (formData.payment_status === 'debt') {
        formDataToSend.set('payment_method', 'credit');
      }

      // If using petty cash, submit as pending expense for approval
      if (formData.payment_method === 'petty_cash' && formData.petty_cash_account_id) {
        const paymentAmount = formData.payment_status === 'partial' 
          ? formData.partial_payment_amount 
          : formData.amount;
          
        // Create FormData for pending expense submission (supports file upload)
        const pendingExpenseData = new FormData();
        pendingExpenseData.append('amount', paymentAmount);
        pendingExpenseData.append('description', formData.description);
        pendingExpenseData.append('category', formData.expense_category || 'General');
        pendingExpenseData.append('vendor_name', formData.supplier_id ? (Array.isArray(suppliers) ? suppliers.find(s => s.id == formData.supplier_id)?.name || suppliers.find(s => s.id == formData.supplier_id)?.company : '') : '');
        pendingExpenseData.append('receipt_number', formData.reference_number || '');
        pendingExpenseData.append('expense_account_id', formData.expense_account_id);
        pendingExpenseData.append('reference_number', formData.reference_number || '');
        pendingExpenseData.append('expense_date', formData.expense_date);
        pendingExpenseData.append('notes', formData.notes || '');
        
        // Add receipt file if present
        if (formData.receipt) {
          pendingExpenseData.append('receipt', formData.receipt);
        }
        
        // Submit pending expense for approval
        const response = await axios.post(`${BASE_URL}/pending-petty-cash/users/${formData.petty_cash_account_id}/submit-expense`, pendingExpenseData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Store submitted expense data and show success modal
        const selectedUser = pettyCashAccounts.find(user => user.id == formData.petty_cash_account_id);
        setSubmittedExpenseData({
          amount: paymentAmount,
          description: formData.description,
          user: selectedUser?.full_name || selectedUser?.username,
          reference: formData.reference_number,
          date: formData.expense_date
        });
        setShowSuccessModal(true);
        return; // Don't navigate immediately
      } else {
        // Regular expense creation
        await axios.post(`${BASE_URL}/expenses`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      navigate('/home');
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
    navigate('/home');
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900 text-start">Add Expense</h1>
          <button
            onClick={() => navigate('/home')}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {warning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Date*</label>
              <input
                type="date"
                required
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Amount*</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Payment Status*</label>
              <select
                required
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.payment_status}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
              >
                <option value="full">Paid in Full</option>
                <option value="debt">Debt (Account Payable)</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">
                Payment Method{formData.payment_status === 'debt' ? ' (Not Required for Debt)' : '*'}
              </label>
              <select
                required={formData.payment_status !== 'debt'}
                disabled={formData.payment_status === 'debt'}
                className={`w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start ${
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
                <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Petty Cash User*</label>
                <select
                  required
                  className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                  value={formData.petty_cash_account_id}
                  onChange={(e) => handlePettyCashAccountChange(e.target.value)}
                >
                  <option value="">Select petty cash user</option>
                  {pettyCashAccounts.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.username} ({user.employee_id}) - Balance: {formatCurrency(user.current_balance || 0)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Reference Number</label>
              <input
                type="text"
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="Enter reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Expense Account*</label>
              <select
                required
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
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
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Boarding House*</label>
              <select
                required
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
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
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Supplier (Optional)</label>
              <select
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
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



            {/* Partial Payment Fields */}
            {formData.payment_status === 'partial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Partial Payment Amount*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                    value={formData.partial_payment_amount}
                    onChange={(e) => {
                      const partialAmount = e.target.value;
                      const totalAmount = parseFloat(formData.amount) || 0;
                      const remaining = totalAmount - (parseFloat(partialAmount) || 0);
                      setFormData(prev => ({ 
                        ...prev, 
                        partial_payment_amount: partialAmount,
                        remaining_balance: remaining > 0 ? remaining.toFixed(2) : '0.00'
                      }));
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Remaining Balance</label>
                  <input
                    type="text"
                    disabled
                    className="w-full text-sm border border-gray-200 px-3 py-2 bg-gray-100 text-gray-600 text-start"
                    value={formatCurrency(formData.remaining_balance)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Remaining Payment Method*</label>
                  <select
                    required
                    className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                    value={formData.remaining_payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, remaining_payment_method: e.target.value }))}
                  >
                    <option value="">Select payment method for remaining balance</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit">Credit (Account Payable)</option>
                  </select>
                </div>
              </>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Description*</label>
              <textarea
                required
                rows={3}
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter expense description"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Notes</label>
              <textarea
                rows={2}
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-start">Receipt</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-start"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500 mt-1 text-start">Upload receipt image or PDF (optional)</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedExpenseData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-md w-full border border-gray-200">
            <div className="flex items-center mb-4">
              <FiCheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Expense Submitted for Approval</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p><span className="font-medium">Amount:</span> {formatCurrency(submittedExpenseData.amount)}</p>
              <p><span className="font-medium">Description:</span> {submittedExpenseData.description}</p>
              <p><span className="font-medium">Petty Cash User:</span> {submittedExpenseData.user}</p>
              <p><span className="font-medium">Date:</span> {submittedExpenseData.date}</p>
              {submittedExpenseData.reference && (
                <p><span className="font-medium">Reference:</span> {submittedExpenseData.reference}</p>
              )}
            </div>
            <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 mb-4">
              <FiClock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>This expense is pending approval from the petty cash administrator.</span>
            </div>
            <button
              onClick={handleModalClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;