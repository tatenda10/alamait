import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../context/Api';

export default function AddPayment({ 
  studentId, 
  studentName, 
  paymentSchedules, 
  feeTypes,
  adminFee,
  securityDeposit,
  currency,
  boardingHouseId
}) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [feeType, setFeeType] = useState('monthly_rent');
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]); // Add payment date state
  const [remainingSecurityDeposit, setRemainingSecurityDeposit] = useState(securityDeposit || 0);

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

  // Check if schedule is required based on fee type
  const isScheduleRequired = (type) => {
    return type === 'monthly_rent';
  };

  // Reset schedule and set predefined amount when fee type changes
  const handleFeeTypeChange = (e) => {
    const newFeeType = e.target.value;
    setFeeType(newFeeType);
    setError(''); // Clear any existing errors
    
    // Clear schedule if not required
    if (!isScheduleRequired(newFeeType)) {
      setSelectedSchedule('');
    }
    
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
        if (!selectedSchedule) {
          return 'Please select a payment schedule for monthly rent';
        }
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
        schedule_id: selectedSchedule || undefined,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        fee_type: feeType,
        payment_date: paymentDate,
        notes: notes || undefined,
        boarding_house_id: boardingHouseId
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
      setPaymentMethod('cash');
      setSelectedSchedule('');
      setFeeType('monthly_rent');
      setReceipt(null);
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
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
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
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
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
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
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
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
            className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>

        {isScheduleRequired(feeType) && (
          <div>
            <label htmlFor="schedule" className="block text-xs font-medium text-gray-700 mb-1">
              Payment Schedule
            </label>
            <select
              id="schedule"
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
              required
            >
              <option value="">Select a schedule</option>
              {paymentSchedules.map((schedule, index) => (
                <option key={schedule.id} value={schedule.id}>
                  Period {index + 1}: {new Date(schedule.period_start_date).toLocaleDateString()} - {new Date(schedule.period_end_date).toLocaleDateString()}
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
          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#E78D69]/10 file:text-[#E78D69] hover:file:bg-[#E78D69]/20"
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
          className="block w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
          placeholder="Add any additional notes about this payment..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-xs font-medium text-white bg-[#E78D69] hover:bg-[#E78D69]/90 rounded disabled:opacity-50"
        >
          {loading ? 'Adding Payment...' : 'Add Payment'}
        </button>
      </div>
    </form>
  );
} 