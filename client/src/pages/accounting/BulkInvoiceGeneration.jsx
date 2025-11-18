import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';
import { 
  CalendarIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function BulkInvoiceGeneration() {
  const { token } = useAuth();
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  useEffect(() => {
    fetchBoardingHouses();
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
    setInvoiceDate(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse && selectedMonth) {
      fetchPreview();
    } else {
      setPreviewData(null);
      setStudents([]);
    }
  }, [selectedBoardingHouse, selectedMonth]);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
    } catch (err) {
      console.error('Error fetching boarding houses:', err);
      setError('Failed to load boarding houses');
    }
  };

  const fetchPreview = async () => {
    if (!selectedBoardingHouse || !selectedMonth) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get(`${BASE_URL}/monthly-invoices/preview`, {
        params: {
          boarding_house_id: selectedBoardingHouse,
          invoice_month: selectedMonth
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setPreviewData(response.data.data);
        // Initialize students with monthly_rent as invoice_amount
        const studentsData = (response.data.data.students || []).map(student => ({
          ...student,
          invoice_amount: student.monthly_rent,
          isEditing: false
        }));
        setStudents(studentsData);
        
        if (studentsData.length === 0) {
          setError('No active students with bed assignments found for the selected boarding house.');
        }
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
      setError(err.response?.data?.message || 'Failed to load preview');
      setPreviewData(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (enrollmentId, newAmount) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.enrollment_id === enrollmentId
          ? { ...student, invoice_amount: parseFloat(newAmount) || 0 }
          : student
      )
    );
  };

  const handleGenerateInvoices = async () => {
    if (!selectedBoardingHouse || !selectedMonth) {
      setError('Please select boarding house and month');
      return;
    }

    if (students.length === 0) {
      setError('No students to invoice');
      return;
    }

    if (!window.confirm(
      `Generate ${students.length} invoices for ${previewData.boarding_house_name} for ${selectedMonth}?\n\nTotal Amount: ${previewData.currency || '$'}${students.reduce((sum, s) => sum + s.invoice_amount, 0).toFixed(2)}`
    )) {
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Prepare students data with adjusted amounts
      const studentsData = students.map(student => ({
        enrollment_id: student.enrollment_id,
        amount: student.invoice_amount
      }));

      const response = await axios.post(
        `${BASE_URL}/monthly-invoices/generate`,
        {
          invoice_month: selectedMonth,
          invoice_date: invoiceDate,
          boarding_house_id: parseInt(selectedBoardingHouse),
          description_prefix: 'Monthly Rent',
          students: studentsData
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setGenerationResult({
          total_invoices: response.data.data.total_invoices,
          total_amount: response.data.data.total_amount,
          currency: previewData.currency || '$',
          month: selectedMonth
        });
        setShowSuccessModal(true);
        // Refresh preview
        fetchPreview();
      }
    } catch (err) {
      console.error('Error generating invoices:', err);
      setError(err.response?.data?.message || 'Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMonthName = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Monthly Invoice Generation</h1>
        <p className="text-xs text-gray-500">
          Generate monthly invoices for active students by boarding house. Preview and adjust amounts before generating.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded">
          {success}
        </div>
      )}

      {/* Selection Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Select Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Boarding House */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Boarding House *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedBoardingHouse}
                onChange={(e) => setSelectedBoardingHouse(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              >
                <option value="">Select boarding house</option>
                {boardingHouses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Invoice Month *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
              />
            </div>
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Invoice Date *
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
            />
          </div>
        </div>

        {/* Preview Button */}
        {selectedBoardingHouse && selectedMonth && (
          <div className="mt-4">
            <button
              onClick={fetchPreview}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading Preview...' : 'Preview Invoices'}
            </button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#f58020]"></div>
          <p className="mt-2 text-xs text-gray-600">Loading preview...</p>
        </div>
      )}

      {previewData && !loading && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Preview: {previewData.boarding_house_name}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Month: {selectedMonth} | {previewData.total_students} students
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total Amount</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(students.reduce((sum, s) => sum + s.invoice_amount, 0))}
                </div>
              </div>
            </div>

          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">
                Students & Invoice Amounts
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monthly Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Current Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.enrollment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {student.student_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {student.room_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatCurrency(student.monthly_rent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {student.isEditing ? (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                value={student.invoice_amount}
                                onChange={(e) => handleAmountChange(student.enrollment_id, e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                              />
                              <button
                                onClick={() => {
                                  setStudents(prev =>
                                    prev.map(s =>
                                      s.enrollment_id === student.enrollment_id
                                        ? { ...s, isEditing: false }
                                        : s
                                    )
                                  );
                                }}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(student.invoice_amount)}
                              </span>
                              {student.invoice_amount !== student.monthly_rent && (
                                <span className="text-xs text-orange-600">(adjusted)</span>
                              )}
                              <button
                                onClick={() => {
                                  setStudents(prev =>
                                    prev.map(s =>
                                      s.enrollment_id === student.enrollment_id
                                        ? { ...s, isEditing: true }
                                        : s
                                    )
                                  );
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit amount"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatCurrency(student.current_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">
                      {formatCurrency(students.reduce((sum, s) => sum + s.invoice_amount, 0))}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setPreviewData(null);
                setStudents([]);
                setSelectedBoardingHouse('');
              }}
              className="px-4 py-2 border border-gray-300 text-xs font-medium text-gray-700 bg-white rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateInvoices}
              disabled={generating || students.length === 0}
              className="px-4 py-2 bg-[#f58020] text-white text-xs font-medium rounded hover:bg-[#f58020]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Invoices'}
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!previewData && !loading && selectedBoardingHouse && selectedMonth && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Preview Available</h3>
          <p className="mt-2 text-xs text-gray-500">
            Click "Preview Invoices" to see the list of students that will be invoiced.
          </p>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && generationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Invoices Generated Successfully
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setGenerationResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-4">
                  <span className="font-semibold text-gray-900">
                    {formatMonthName(generationResult.month)}
                  </span>{' '}
                  invoices have been successfully generated.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total Invoices:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {generationResult.total_invoices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(generationResult.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setGenerationResult(null);
                  }}
                  className="px-4 py-2 bg-[#f58020] text-white text-xs font-medium rounded hover:bg-[#f58020]/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

