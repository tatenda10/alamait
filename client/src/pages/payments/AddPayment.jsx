import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../context/Api';

export default function AddPayment({ 
  studentId, 
  studentName, 
  feeTypes,
  adminFee,
  securityDeposit,
  currency,
  boardingHouseId
}) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_to_admin');
  const [feeType, setFeeType] = useState('monthly_rent');
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remainingSecurityDeposit, setRemainingSecurityDeposit] = useState(securityDeposit || 0);
  const [pettyCashAccounts, setPettyCashAccounts] = useState([]);
  const [selectedPettyCashAccount, setSelectedPettyCashAccount] = useState('');

  // Fetch remaining security deposit amount
  useEffect(() => {
    const fetchRemainingSecurityDeposit = async () => {
      if (feeType === 'security_deposit') {
        try {
          const response = await axios.get(
            `${BASE_URL}/payments/students/${studentId}/security-deposit-balance`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          setRemainingSecurityDeposit(response.data.remaining_amount);
        } catch (err) {
          console.error('Error fetching security deposit balance:', err);
          // If we can't fetch the remaining amount, use the full amount
          setRemainingSecurityDeposit(securityDeposit || 0);
        }
      }
    };

    fetchRemainingSecurityDeposit();
  }, [feeType, studentId, securityDeposit]);

  // Fetch petty cash accounts for the boarding house
  useEffect(() => {
    const fetchPettyCashAccounts = async () => {
      if (boardingHouseId) {
        try {
          const response = await axios.get(
            `${BASE_URL}/petty-cash-admin/users`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.data.success) {
            // Filter accounts for this boarding house and map to the expected format
            const accounts = response.data.users
              .filter(account => account.boarding_house_id == boardingHouseId)
              .map(account => ({
                id: account.id,
                name: `${account.account_name} (${account.username})`,
                current_balance: parseFloat(account.current_balance) || 0,
                boarding_house_name: account.boarding_house_name
              }));
            
            setPettyCashAccounts(accounts);
          }
        } catch (err) {
          console.error('Error fetching petty cash accounts:', err);
          // Fallback to empty array if API fails
          setPettyCashAccounts([]);
        }
      }
    };

    fetchPettyCashAccounts();
  }, [boardingHouseId]);

  // Reset amount when fee type changes
  const handleFeeTypeChange = (e) => {
    const newFeeType = e.target.value;
    setFeeType(newFeeType);
    setError(''); // Clear any existing errors
    
    // Set predefined amount based on fee type
    switch (newFeeType) {
      case 'admin_fee':
        setAmount(adminFee ? adminFee.toString() : '');
        break;
      case 'security_deposit':
        // For security deposit, set the remaining amount as default
        setAmount(remainingSecurityDeposit.toString());
        break;
      default:
        setAmount('');
    }
  };

  const validatePayment = (paymentAmount) => {
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return 'Please enter a valid payment amount greater than 0';
    }

    switch (feeType) {
      case 'admin_fee':
        // Admin fee must be paid in full
        if (paymentAmount !== parseFloat(adminFee)) {
          return `Admin fee must be paid in full (${currency} ${adminFee})`;
        }
        break;
      
      case 'security_deposit':
        // Security deposit can be paid in installments
        if (paymentAmount > remainingSecurityDeposit) {
          return `Payment amount cannot exceed remaining security deposit (${currency} ${remainingSecurityDeposit})`;
        }
        break;
      
      case 'monthly_rent':
        // Add any specific validation for monthly rent if needed
        break;
    }

    return null; // No validation errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug log before sending
      const paymentData = {
        student_id: studentId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        fee_type: feeType,
        payment_date: paymentDate,
        notes: notes || undefined,
        boarding_house_id: boardingHouseId,
        petty_cash_account_id: paymentMethod === 'cash_to_ba' ? selectedPettyCashAccount : undefined
      };

      console.log('Sending payment data:', paymentData);

      const response = await axios.post(
        `${BASE_URL}/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Reset form
      setAmount('');
      setPaymentMethod('cash_to_admin');
      setFeeType('monthly_rent');
      setReceipt(null);
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setSelectedPettyCashAccount('');
      
      // Refresh the page to show new payment
      window.location.reload();
    } catch (err) {
      console.error('Error adding payment:', err);
      setError(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment Date Field */}
        <div>
          <label htmlFor="payment_date" className="block text-xs font-medium text-gray-700 mb-1">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="payment_date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            required
          />
        </div>

        <div>
          <label htmlFor="feeType" className="block text-xs font-medium text-gray-700 mb-1">
            Fee Type
          </label>
          <select
            id="feeType"
            value={feeType}
            onChange={handleFeeTypeChange}
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            required
          >
            {feeTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.label} {type.amount ? `(${currency} ${type.amount})` : ''}
              </option>
            ))}
          </select>
          {feeType === 'security_deposit' && remainingSecurityDeposit > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Remaining balance: {currency} {remainingSecurityDeposit}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-gray-700 mb-1">
            Amount ({currency})
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            required
            min="0"
            step="0.01"
            max={feeType === 'security_deposit' ? remainingSecurityDeposit : undefined}
          />
          {feeType === 'security_deposit' && (
            <p className="mt-1 text-xs text-gray-500">
              You can pay the security deposit in installments
            </p>
          )}
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-xs font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            required
          >
            <option value="cash_to_admin">Cash to Admin</option>
            <option value="cash_to_ba">Cash to BA (Petty Cash)</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>

        {paymentMethod === 'cash_to_ba' && (
          <div>
            <label htmlFor="pettyCashAccount" className="block text-xs font-medium text-gray-700 mb-1">
              Petty Cash Account
            </label>
            <select
              id="pettyCashAccount"
              value={selectedPettyCashAccount}
              onChange={(e) => setSelectedPettyCashAccount(e.target.value)}
              className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              required
            >
              <option value="">Select petty cash account</option>
              {pettyCashAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (Balance: ${(account.current_balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="receipt" className="block text-xs font-medium text-gray-700 mb-1">
          Receipt (Optional)
        </label>
        <input
          type="file"
          id="receipt"
          onChange={(e) => setReceipt(e.target.files[0])}
          accept=".pdf,.jpg,.jpeg,.png"
          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#f58020]/10 file:text-[#f58020] hover:file:bg-[#f58020]/20"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
          placeholder="Add any additional notes about this payment..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-xs font-medium text-white bg-[#f58020] hover:bg-[#f58020]/90 rounded disabled:opacity-50"
        >
          {loading ? 'Adding Payment...' : 'Add Payment'}
        </button>
      </div>
    </form>
  );
} 