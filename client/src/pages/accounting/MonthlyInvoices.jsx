import { useState, useEffect } from 'react';
import axios from 'axios';

const MonthlyInvoices = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingLoading, setGeneratingLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Set current month as default
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
    setInvoiceDate(now.toISOString().split('T')[0]);
  }, []);

  // Fetch invoice summary when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchInvoiceSummary();
    }
  }, [selectedMonth]);

  const fetchInvoiceSummary = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/monthly-invoices/summary/${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSummary(response.data.data.summary);
        setInvoices(response.data.data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      if (error.response?.status === 404 || error.response?.data?.success === false) {
        setSummary(null);
        setInvoices([]);
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch invoice summary'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!selectedMonth) {
      setMessage({ type: 'error', text: 'Please select a month' });
      return;
    }

    if (window.confirm(`Generate invoices for ${selectedMonth}? This will create invoices for all active students.`)) {
      setGeneratingLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:3001/api/monthly-invoices/generate',
          {
            invoice_month: selectedMonth,
            invoice_date: invoiceDate,
            description_prefix: 'Monthly Rent'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setMessage({
            type: 'success',
            text: `Successfully generated ${response.data.data.total_invoices} invoices for ${selectedMonth}. Total: $${response.data.data.total_amount.toFixed(2)}`
          });
          
          // Show errors if any
          if (response.data.data.errors && response.data.data.errors.length > 0) {
            console.error('Invoice generation errors:', response.data.data.errors);
          }

          // Refresh the summary
          fetchInvoiceSummary();
        }
      } catch (error) {
        console.error('Error generating invoices:', error);
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to generate invoices'
        });
      } finally {
        setGeneratingLoading(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Monthly Invoices</h1>
        <p className="text-gray-600">Generate and manage monthly rent invoices</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invoice Generation Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate Invoices</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateInvoices}
              disabled={generatingLoading || !selectedMonth}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {generatingLoading ? 'Generating...' : 'Generate Invoices'}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          This will create invoices for all active students for the selected month.
        </p>
      </div>

      {/* Summary Section */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading invoice summary...</p>
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Total Invoices</div>
              <div className="text-2xl font-bold text-gray-800">{summary.total_invoices || 0}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(summary.total_amount || 0)}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.pending_count || 0}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(summary.pending_amount || 0)}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Paid</div>
              <div className="text-2xl font-bold text-green-600">{summary.paid_count || 0}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(summary.paid_amount || 0)}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Overdue</div>
              <div className="text-2xl font-bold text-red-600">{summary.overdue_count || 0}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(summary.overdue_amount || 0)}</div>
            </div>
          </div>

          {/* Invoice List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Invoice Details - {selectedMonth}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boarding House
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.room_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.boarding_house_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.reference_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-600 mb-4">
            No invoices have been generated for {selectedMonth} yet.
          </p>
          <p className="text-sm text-gray-500">
            Click "Generate Invoices" above to create invoices for all active students.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyInvoices;

