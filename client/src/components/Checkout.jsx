import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../context/Api';

export default function Checkout({ studentId, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationNotes, setTerminationNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState({
    payments: { checked: false, notes: '' },
    keys: { checked: false, notes: '' },
    inspection: { checked: false, notes: '' },
    cleaning: { checked: false, notes: '' },
    belongings: { checked: false, notes: '' }
  });

  // Fetch existing checkout details if any
  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/checkout/students/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data) {
          const { 
            checkout_date,
            checkout_reason,
            checkout_notes,
            checkout_checklist
          } = response.data;

          setTerminationDate(checkout_date || '');
          setTerminationReason(checkout_reason || '');
          setTerminationNotes(checkout_notes || '');
          if (checkout_checklist) {
            try {
              const parsedChecklist = typeof checkout_checklist === 'string' 
                ? JSON.parse(checkout_checklist) 
                : checkout_checklist;
              setChecklistItems(parsedChecklist);
            } catch (e) {
              console.error('Error parsing checklist:', e);
            }
          }
        }
      } catch (error) {
        // Only set error if it's not a 404 (no previous checkout)
        if (error.response?.status !== 404) {
          setError('Failed to load checkout details');
          console.error('Error fetching checkout details:', error);
        }
      }
    };

    if (studentId) {
      fetchCheckoutDetails();
    }
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/checkout/students/${studentId}`,
        {
          terminationDate,
          terminationReason,
          terminationNotes,
          checklistItems
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data) {
        onSuccess?.(response.data);
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      setError(error.response?.data?.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      terminationDate &&
      terminationReason &&
      Object.values(checklistItems).every(item => item.checked)
    );
  };

  const updateChecklistItem = (key, checked, notes) => {
    setChecklistItems(prev => ({
      ...prev,
      [key]: { checked, notes }
    }));
  };

  return (
    <div className="border border-gray-200">
      <div className="p-6">
        <h3 className="text-base font-medium text-gray-900 mb-6">Room Checkout</h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Warning: Checking out from a room will end the student's current lease. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Termination Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checkout Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="block w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-[#f58020] focus:ring-[#f58020]"
              placeholder="dd/mm/yyyy"
            />
          </div>

          {/* Reason for Termination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Checkout <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              className="block w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-[#f58020] focus:ring-[#f58020]"
            >
              <option value="">Select a reason</option>
              <option value="end_of_lease">End of Lease</option>
              <option value="graduation">Graduation</option>
              <option value="transfer">Transfer to Another School</option>
              <option value="financial">Financial Reasons</option>
              <option value="violation">Policy Violation</option>
              <option value="personal">Personal Reasons</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Checkout Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Checkout Checklist
            </label>
            <div className="space-y-4 border border-gray-200 rounded-lg p-6">
              {/* Payment Verification */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checklistItems.payments.checked}
                    onChange={(e) => updateChecklistItem('payments', e.target.checked, checklistItems.payments.notes)}
                    className="h-5 w-5 text-[#f58020] focus:ring-[#f58020] border-gray-300 rounded"
                  />
                  <span className="ml-4 text-sm text-gray-700">All payments settled</span>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={checklistItems.payments.notes}
                  onChange={(e) => updateChecklistItem('payments', checklistItems.payments.checked, e.target.value)}
                  className="text-sm border-gray-200 rounded w-96 px-4 py-2"
                />
              </div>

              {/* Keys Return */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checklistItems.keys.checked}
                    onChange={(e) => updateChecklistItem('keys', e.target.checked, checklistItems.keys.notes)}
                    className="h-5 w-5 text-[#f58020] focus:ring-[#f58020] border-gray-300 rounded"
                  />
                  <span className="ml-4 text-sm text-gray-700">Keys returned</span>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={checklistItems.keys.notes}
                  onChange={(e) => updateChecklistItem('keys', checklistItems.keys.checked, e.target.value)}
                  className="text-sm border-gray-200 rounded w-96 px-4 py-2"
                />
              </div>

              {/* Room Inspection */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checklistItems.inspection.checked}
                    onChange={(e) => updateChecklistItem('inspection', e.target.checked, checklistItems.inspection.notes)}
                    className="h-5 w-5 text-[#f58020] focus:ring-[#f58020] border-gray-300 rounded"
                  />
                  <span className="ml-4 text-sm text-gray-700">Room inspection completed</span>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={checklistItems.inspection.notes}
                  onChange={(e) => updateChecklistItem('inspection', checklistItems.inspection.checked, e.target.value)}
                  className="text-sm border-gray-200 rounded w-96 px-4 py-2"
                />
              </div>

              {/* Room Cleaning */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checklistItems.cleaning.checked}
                    onChange={(e) => updateChecklistItem('cleaning', e.target.checked, checklistItems.cleaning.notes)}
                    className="h-5 w-5 text-[#f58020] focus:ring-[#f58020] border-gray-300 rounded"
                  />
                  <span className="ml-4 text-sm text-gray-700">Room cleaned</span>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={checklistItems.cleaning.notes}
                  onChange={(e) => updateChecklistItem('cleaning', checklistItems.cleaning.checked, e.target.value)}
                  className="text-sm border-gray-200 rounded w-96 px-4 py-2"
                />
              </div>

              {/* Belongings Removed */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checklistItems.belongings.checked}
                    onChange={(e) => updateChecklistItem('belongings', e.target.checked, checklistItems.belongings.notes)}
                    className="h-5 w-5 text-[#f58020] focus:ring-[#f58020] border-gray-300 rounded"
                  />
                  <span className="ml-4 text-sm text-gray-700">All belongings removed</span>
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={checklistItems.belongings.notes}
                  onChange={(e) => updateChecklistItem('belongings', checklistItems.belongings.checked, e.target.value)}
                  className="text-sm border-gray-200 rounded w-96 px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={terminationNotes}
              onChange={(e) => setTerminationNotes(e.target.value)}
              rows={4}
              className="block w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-[#f58020] focus:ring-[#f58020]"
              placeholder="Add any additional notes about the checkout..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Complete Checkout'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 