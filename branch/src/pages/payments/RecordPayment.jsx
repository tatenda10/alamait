import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import BASE_URL from '../../utils/api';

const RecordPayment = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    receipt: null
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    console.log('Search effect triggered:');
    console.log('- Search term:', searchTerm);
    console.log('- Students:', students);
    console.log('- Students length:', students.length);
    
    if (searchTerm) {
      const filtered = students.filter(student => {
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
        const idNumber = student.id_number?.toLowerCase() || '';
        const email = student.email?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        const matches = fullName.includes(searchLower) || 
               idNumber.includes(searchLower) || 
               email.includes(searchLower);
        
        console.log(`Student ${student.first_name} ${student.last_name}:`, {
          fullName,
          idNumber,
          email,
          searchLower,
          matches
        });
        
        return matches;
      });
      console.log('Filtered students:', filtered);
      setFilteredStudents(filtered);
    } else {
      console.log('No search term, showing all students');
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/students`, getAuthHeaders());
      console.log('Students API response:', response.data);
      console.log('Response status:', response.status);
      console.log('Is array:', Array.isArray(response.data));
      console.log('Data length:', response.data?.length);
      // Ensure we always set an array, even if the response is empty or invalid
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]); // Ensure students is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
    setPaymentForm(prev => ({
      ...prev,
      description: `Payment from ${student.first_name} ${student.last_name}`
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPaymentForm(prev => ({
      ...prev,
      receipt: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const paymentData = {
        student_id: selectedStudent.id,
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        description: paymentForm.description,
        reference_number: paymentForm.reference_number
      };


      const response = await axios.post(`${BASE_URL}/branch-payments`, paymentData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'boarding-house-id': localStorage.getItem('boarding_house_id'),
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccessData({
          studentName: selectedStudent.first_name + ' ' + selectedStudent.last_name,
          amount: paymentForm.amount,
          referenceNumber: paymentForm.reference_number || response.data.payment?.reference_number
        });
        setShowSuccessModal(true);
        setShowPaymentModal(false);
        setSelectedStudent(null);
        setPaymentForm({
          amount: '',
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          description: '',
          reference_number: '',
          receipt: null
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to record payment: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        icon: CalendarIcon,
        label: 'Pending'
      },
      completed: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        icon: CheckCircleIcon,
        label: 'Completed'
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        icon: XCircleIcon,
        label: 'Rejected'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.bg} ${config.text} ring-current/20`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Record Payment</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Record student payments that require admin approval
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="mt-6">
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Select Student</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {student.id_number} • {student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        student.status === 'Active' 
                          ? 'text-green-700 bg-green-50 ring-green-600/20'
                          : 'text-gray-700 bg-gray-50 ring-gray-600/20'
                      }`}>
                        {student.status}
                      </span>
                      <PlusIcon className="h-4 w-4 text-[#E78D69]" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No students found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Transition.Root show={showPaymentModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowPaymentModal}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-3">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-5 w-5 text-[#E78D69] mr-2" />
                          Record Payment
                        </div>
                      </Dialog.Title>
                      
                      {selectedStudent && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedStudent.first_name} {selectedStudent.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {selectedStudent.id_number} • {selectedStudent.email}
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              name="amount"
                              value={paymentForm.amount}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-[#E78D69] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Payment Method
                            </label>
                            <div className="w-full border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700">
                              Cash
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Payment Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            name="payment_date"
                            value={paymentForm.payment_date}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={paymentForm.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Reference Number
                          </label>
                          <input
                            type="text"
                            name="reference_number"
                            value={paymentForm.reference_number}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-[#E78D69] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Receipt (Optional)
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <CloudArrowUpIcon className="mx-auto h-6 w-6 text-gray-400" />
                              <div className="flex text-xs text-gray-600">
                                <label
                                  htmlFor="receipt-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-[#E78D69] hover:text-[#E78D69]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#E78D69]"
                                >
                                  <span>Upload receipt</span>
                                  <input
                                    id="receipt-upload"
                                    name="receipt-upload"
                                    type="file"
                                    className="sr-only"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                            </div>
                          </div>
                          {paymentForm.receipt && (
                            <div className="mt-2 flex items-center text-xs text-gray-600">
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              {paymentForm.receipt.name}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-2 text-xs font-medium text-white bg-[#E78D69] border border-[#E78D69] hover:bg-[#E78D69]/90 disabled:opacity-50"
                          >
                            {submitting ? 'Recording...' : 'Record Payment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Success Modal */}
      <Transition appear show={showSuccessModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowSuccessModal(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 text-center mb-2">
                    Payment Recorded Successfully
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600 text-center">
                      Payment has been recorded and is pending admin approval.
                    </p>
                    
                    {successData && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Student:</span>
                          <span className="text-xs font-medium text-gray-900">{successData.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Amount:</span>
                          <span className="text-xs font-medium text-gray-900">${parseFloat(successData.amount).toFixed(2)}</span>
                        </div>
                        {successData.referenceNumber && (
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Reference:</span>
                            <span className="text-xs font-medium text-gray-900">{successData.referenceNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-[#E78D69] px-4 py-2 text-sm font-medium text-white hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
                      onClick={() => {
                        setShowSuccessModal(false);
                        setSuccessData(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default RecordPayment;
