import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';

export default function AddPayment({ studentId, onPaymentAdded }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [feeType, setFeeType] = useState('monthly_rent');
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');

  const feeTypes = [
    { id: 'monthly_rent', label: 'Monthly Rent' },
    { id: 'admin_fee', label: 'Admin Fee' },
    { id: 'security_deposit', label: 'Security Deposit' },
    { id: 'utilities', label: 'Utilities' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('student_id', studentId);
      formData.append('amount', parseFloat(amount));
      formData.append('payment_method', paymentMethod);
      formData.append('fee_type', feeType);
      formData.append('payment_date', paymentDate);
      formData.append('reference_number', referenceNumber);
      if (notes) formData.append('notes', notes);
      if (receipt) formData.append('receipt', receipt);

      const response = await axios.post(
        `${BASE_URL}/payments`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Reset form
      setAmount('');
      setPaymentMethod('cash');
      setFeeType('monthly_rent');
      setReceipt(null);
      setNotes('');
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsModalOpen(false);
      
      // Call the callback to refresh payments
      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      setError(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Payment
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Payment</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="payment_date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="feeType" className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="feeType"
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                    required
                  >
                    {feeTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  placeholder="Transaction reference number"
                />
              </div>

              <div>
                <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt (Optional)
                </label>
                <input
                  type="file"
                  id="receipt"
                  onChange={(e) => setReceipt(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#E78D69]/10 file:text-[#E78D69] hover:file:bg-[#E78D69]/20"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  placeholder="Add any additional notes about this payment..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90 disabled:opacity-50"
                >
                  {loading ? 'Adding Payment...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}