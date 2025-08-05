import React, { useState } from 'react';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

// Sample data
const SAMPLE_INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-2024-001',
    student_name: 'John Doe',
    due_date: '2024-03-25',
    amount: 500,
    status: 'pending'
  },
  {
    id: 2,
    invoice_number: 'INV-2024-002',
    student_name: 'Jane Smith',
    due_date: '2024-03-20',
    amount: 750,
    status: 'paid'
  },
  {
    id: 3,
    invoice_number: 'INV-2024-003',
    student_name: 'Mike Johnson',
    due_date: '2024-03-15',
    amount: 600,
    status: 'overdue'
  }
];

const Invoices = () => {
  const [invoices, setInvoices] = useState(SAMPLE_INVOICES);
  const [loading, setLoading] = useState(false);

  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePayInvoice = (invoiceId) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === invoiceId
            ? { ...invoice, status: 'paid' }
            : invoice
        )
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Student Invoices</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Manage and track student payment invoices
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => {/* TODO: Add new invoice */}}
            className="inline-block bg-[#E78D69] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
          >
            <PlusIcon className="inline-block h-4 w-4 mr-1" />
            Create Invoice
          </button>
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
                    Amount
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-4 border-x border-gray-200">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {invoice.student_name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">
                      ${invoice.amount}
                    </td>
                    <td className="px-3 py-2 text-xs border-r border-gray-200">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-4 border-r border-gray-200">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => {/* TODO: View invoice details */}}
                      >
                        <EyeIcon className="h-4 w-4 inline-block" />
                      </button>
                      {invoice.status === 'pending' && (
                        <button
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-[#E78D69] rounded hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={loading}
                          onClick={() => handlePayInvoice(invoice.id)}
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-sm text-center text-gray-500">
                      No invoices found
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

export default Invoices; 