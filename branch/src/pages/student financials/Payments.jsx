import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../../utils/api';
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Payments = () => {
  const { user } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: '',
    payment_date: '',
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/payments/boarding-house`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setEditForm({
      amount: payment.amount,
      payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
      payment_method: payment.payment_method,
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/payments/${selectedPayment.id}`, editForm, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchPaymentHistory();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/payments/${selectedPayment.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchPaymentHistory();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const filteredPayments = paymentHistory.filter(payment => 
    payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 mt-10">
      <h2 className="text-base font-medium text-gray-900">Payment History</h2>
      <p className="mt-1 text-sm text-gray-500">View all student payments</p>

      {/* Search Bar */}
      <div className="mt-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
            placeholder="Search by student name, reference number, or payment type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="border border-gray-200 rounded-lg">
          <div className="">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Student</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Room</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Type</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Method</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Amount</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Reference</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{payment.student_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">{payment.room_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        <span className="capitalize">
                          {payment.payment_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        <span className="capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{payment.reference_number}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsViewModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(payment)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Payment"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Payment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-500">
                        No payment history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Student</p>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.student_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Room</p>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.room_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedPayment.payment_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="mt-1 text-sm text-gray-900">
                  ${parseFloat(selectedPayment.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Type</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedPayment.payment_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedPayment.payment_method.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reference Number</p>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.reference_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${selectedPayment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {selectedPayment.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Payment</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-md shadow-sm text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input
                  type="date"
                  value={editForm.payment_date}
                  onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-md shadow-sm text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={editForm.payment_method}
                  onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-md shadow-sm text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                <input
                  type="text"
                  value={editForm.reference_number}
                  onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-md shadow-sm text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-md shadow-sm text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Payment</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this payment? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 