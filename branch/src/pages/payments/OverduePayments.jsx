import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

// Sample data
const SAMPLE_OVERDUE = [
  {
    id: 1,
    invoice_number: 'INV-2024-003',
    student_name: 'Mike Johnson',
    due_date: '2024-02-15',
    amount: 600,
    status: 'overdue'
  },
  {
    id: 2,
    invoice_number: 'INV-2024-004',
    student_name: 'Sarah Wilson',
    due_date: '2024-02-20',
    amount: 850,
    status: 'overdue'
  },
  {
    id: 3,
    invoice_number: 'INV-2024-005',
    student_name: 'Tom Brown',
    due_date: '2024-02-25',
    amount: 700,
    status: 'overdue'
  }
];

const OverduePayments = () => {
  const [overduePayments, setOverduePayments] = useState(SAMPLE_OVERDUE);
  const [loading, setLoading] = useState(false);

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(today - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePayment = (invoiceId) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOverduePayments(prevPayments => 
        prevPayments.filter(payment => payment.id !== invoiceId)
      );
      setLoading(false);
    }, 1000);
  };

  const handleSendReminder = (invoiceId, type) => {
    // Simulate sending reminder
    console.log(`Sending ${type} reminder for invoice ${invoiceId}`);
    alert(`${type.toUpperCase()} reminder sent successfully!`);
  };

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Overdue Payments</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Track and manage overdue student payments
          </p>
        </div>
      </div>

      <div className="mt-6 flow-root">
        <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-sm overflow-hidden">
              <thead className="bg-[#02031E]">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-white uppercase tracking-wider sm:pl-4">
                    Invoice #
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overduePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-4 border-x border-gray-200">
                      {payment.invoice_number}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {payment.student_name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {new Date(payment.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs border-r border-gray-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {getDaysOverdue(payment.due_date)} days
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      ${payment.amount}
                    </td>
                    <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-4 border-r border-gray-200">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Send Email Reminder"
                        onClick={() => handleSendReminder(payment.id, 'email')}
                      >
                        <EnvelopeIcon className="h-4 w-4 inline-block" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Send SMS Reminder"
                        onClick={() => handleSendReminder(payment.id, 'sms')}
                      >
                        <PhoneIcon className="h-4 w-4 inline-block" />
                      </button>
                      <button
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-[#E78D69] rounded hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                        onClick={() => handlePayment(payment.id)}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
                {overduePayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-sm text-center text-gray-500">
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
  );
};

export default OverduePayments; 