import React, { useState } from 'react';
import { EyeIcon, MagnifyingGlassIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

// Sample data
const SAMPLE_PAYMENTS = [
  {
    id: 1,
    transaction_date: '2024-03-15',
    reference_no: 'PMT-2024-001',
    student_name: 'John Doe',
    amount: 500,
    payment_method: 'Cash',
    status: 'completed'
  },
  {
    id: 2,
    transaction_date: '2024-03-14',
    reference_no: 'PMT-2024-002',
    student_name: 'Jane Smith',
    amount: 750,
    payment_method: 'Bank Transfer',
    status: 'completed'
  },
  {
    id: 3,
    transaction_date: '2024-03-13',
    reference_no: 'PMT-2024-003',
    student_name: 'Mike Johnson',
    amount: 600,
    payment_method: 'Check',
    status: 'pending'
  },
  {
    id: 4,
    transaction_date: '2024-03-12',
    reference_no: 'PMT-2024-004',
    student_name: 'Sarah Wilson',
    amount: 850,
    payment_method: 'Cash',
    status: 'completed'
  }
];

const PaymentHistory = () => {
  const [payments, setPayments] = useState(SAMPLE_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadReceipt = (paymentId) => {
    // Simulate downloading receipt
    console.log(`Downloading receipt for payment ${paymentId}`);
    alert('Receipt downloaded successfully!');
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateRange = (!startDate || new Date(payment.transaction_date) >= startDate) &&
                           (!endDate || new Date(payment.transaction_date) <= endDate);

    return matchesSearch && matchesDateRange;
  });

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Payment History</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            View and track all student payment transactions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mt-6 mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by student or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-[#E78D69]"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <input
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                className="w-full px-4 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-[#E78D69]"
              />
            </div>
            <div>
              <input
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                className="w-full px-4 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-[#E78D69]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flow-root">
        <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-sm overflow-hidden">
              <thead className="bg-[#02031E]">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-white uppercase tracking-wider sm:pl-4">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-4 border-x border-gray-200">
                      {new Date(payment.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {payment.reference_no}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {payment.student_name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      ${payment.amount}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {payment.payment_method}
                    </td>
                    <td className="px-3 py-2 text-xs border-r border-gray-200">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-4 border-r border-gray-200">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                        onClick={() => {/* TODO: View payment details */}}
                      >
                        <EyeIcon className="h-4 w-4 inline-block" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Download Receipt"
                        onClick={() => handleDownloadReceipt(payment.id)}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-sm text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory; 