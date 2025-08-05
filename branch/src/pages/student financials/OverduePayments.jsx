import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../../utils/api';
import { MagnifyingGlassIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const OverduePayments = () => {
  const { user } = useAuth();
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchOverduePayments();
  }, []);

  const fetchOverduePayments = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/payments/boarding-house/overdue`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOverduePayments(response.data);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(today - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (daysOverdue) => {
    if (daysOverdue <= 7) return 'bg-yellow-100 text-yellow-800';
    if (daysOverdue <= 30) return 'bg-red-100 text-red-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredPayments = overduePayments.filter(payment => 
    payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_type?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <h2 className="text-base font-medium text-gray-900">Overdue Payments</h2>
      <p className="mt-1 text-sm text-gray-500">View and manage overdue student payments</p>

      {/* Search Bar */}
      <div className="mt-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
            placeholder="Search by student name, room, or payment type..."
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
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Student</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Room</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Due Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Days Overdue</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Amount Due</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Payment Type</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => {
                    const daysOverdue = getDaysOverdue(payment.period_end_date);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-900">{payment.student_name}</td>
                        <td className="px-3 py-2 text-xs text-gray-900">{payment.room_name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {new Date(payment.period_end_date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(daysOverdue)}`}>
                            {daysOverdue} days
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-red-600">
                          {payment.currency} {parseFloat(payment.amount_due - payment.amount_paid).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900">
                          <span className="capitalize">
                            {payment.payment_type?.replace('_', ' ') || 'Monthly Rent'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">
                        No overdue payments found
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
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedPayment.period_end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Days Overdue</p>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDaysOverdue(selectedPayment.period_end_date))}`}>
                    {getDaysOverdue(selectedPayment.period_end_date)} days
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount Due</p>
                <p className="mt-1 text-sm font-medium text-red-600">
                  {selectedPayment.currency} {parseFloat(selectedPayment.amount_due - selectedPayment.amount_paid).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Type</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedPayment.payment_type?.replace('_', ' ') || 'Monthly Rent'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverduePayments; 