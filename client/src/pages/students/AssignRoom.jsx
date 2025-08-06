import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowUpIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, isUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Room {isUpdate ? 'Update' : 'Assignment'} Successful
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    The student's room has been successfully {isUpdate ? 'updated' : 'assigned'}.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-[#E78D69] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
                onClick={onClose}
              >
                View Student Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AssignRoom() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [leaseAgreement, setLeaseAgreement] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState(null);
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [adminFee, setAdminFee] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('Using token:', token); // Debug token
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for student:', studentId);
        
        // Fetch student details
        const studentResponse = await axios.get(`${BASE_URL}/students/${studentId}`, getAuthHeaders());
        console.log('Student response:', studentResponse.data);
        setStudent(studentResponse.data);

        // Check if student has a current room assignment
        if (studentResponse.data.room_id) {
          console.log('Student has existing room assignment:', studentResponse.data.room_id);
          setIsUpdate(true);
          setSelectedRoom(studentResponse.data.room_id);
          setStartDate(new Date(studentResponse.data.start_date).toISOString().split('T')[0]);
          setEndDate(new Date(studentResponse.data.expected_end_date).toISOString().split('T')[0]);
          setMonthlyRate(studentResponse.data.agreed_amount?.toString() || '');
          setNotes(studentResponse.data.notes || '');
          
          try {
            // Get current enrollment and payment schedules
            const enrollmentResponse = await axios.get(
              `${BASE_URL}/students/${studentId}/enrollment`,
              getAuthHeaders()
            );
            console.log('Enrollment response:', enrollmentResponse.data);
            
            if (enrollmentResponse.data) {
              setCurrentEnrollmentId(enrollmentResponse.data.id);
              
              // Fetch payment schedules
              const schedulesResponse = await axios.get(
                `${BASE_URL}/students/${studentId}/payment-schedules`,
                getAuthHeaders()
              );
              console.log('Payment schedules response:', schedulesResponse.data);
              setPaymentSchedules(schedulesResponse.data || []);
            }
          } catch (enrollmentError) {
            console.error('Error fetching enrollment details:', {
              message: enrollmentError.message,
              response: enrollmentError.response?.data,
              status: enrollmentError.response?.status
            });
          }
        } else {
          // Initialize first payment schedule for new assignments
          const defaultSchedule = {
            id: Date.now(),
            startDate: startDate || '',
            endDate: endDate || '',
            amount: monthlyRate || '',
            currency: 'USD',
            notes: ''
          };
          setPaymentSchedules([defaultSchedule]);
        }

        try {
          // Fetch available rooms
          const roomsResponse = await axios.get(
            `${BASE_URL}/rooms${isUpdate ? '/all' : '/available'}`,
            getAuthHeaders()
          );
          console.log('Rooms response:', roomsResponse.data);
          setRooms(roomsResponse.data);
        } catch (roomsError) {
          console.error('Error fetching rooms:', {
            message: roomsError.message,
            response: roomsError.response?.data,
            status: roomsError.response?.status
          });
          throw roomsError; // Re-throw to be caught by outer catch
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        setSubmitError(
          error.response?.data?.message || 
          error.message || 
          'Failed to load data. Please check your connection and try again.'
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, isUpdate, startDate, endDate, monthlyRate]);

  // Update payment schedules when dates or rate changes
  useEffect(() => {
    if (!isUpdate && startDate && endDate && monthlyRate) {
      const defaultSchedule = {
        id: Date.now(),
        startDate,
        endDate,
        amount: monthlyRate,
        currency: 'USD',
        notes: ''
      };
      setPaymentSchedules([defaultSchedule]);
    }
  }, [startDate, endDate, monthlyRate, isUpdate]);

  const handleAddSchedule = () => {
    const lastSchedule = paymentSchedules[paymentSchedules.length - 1];
    const newSchedule = {
      id: Date.now(),
      startDate: lastSchedule ? lastSchedule.endDate : startDate,
      endDate: endDate,
      amount: monthlyRate,
      currency: 'USD',
      notes: ''
    };
    setPaymentSchedules([...paymentSchedules, newSchedule]);
  };

  const handleRemoveSchedule = (scheduleId) => {
    setPaymentSchedules(paymentSchedules.filter(schedule => schedule.id !== scheduleId));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...paymentSchedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value
    };
    setPaymentSchedules(updatedSchedules);
  };

  const calculateTotalInitialPayment = () => {
    const monthlyRent = parseFloat(monthlyRate) || 0;
    const securityDepositAmount = parseFloat(securityDeposit) || 0;
    return (monthlyRent + securityDepositAmount).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation checks
      if (!selectedRoom) throw new Error('Please select a room');
      if (!startDate) throw new Error('Please select a start date');
      if (!endDate) throw new Error('Please select an end date');
      if (!monthlyRate) throw new Error('Please enter the monthly rate');
      if (!isUpdate && !leaseAgreement) throw new Error('Please upload the lease agreement');
      if (paymentSchedules.length === 0) throw new Error('Please add at least one payment schedule');

      // Validate payment schedules
      for (const schedule of paymentSchedules) {
        if (!schedule.startDate || !schedule.endDate || !schedule.amount) {
          throw new Error('Please fill in all payment schedule fields');
        }
      }

      let documentId = null;

      // Upload new lease agreement if provided
      if (leaseAgreement) {
        console.log('Uploading lease agreement:', leaseAgreement.name);
        const formData = new FormData();
        formData.append('document', leaseAgreement);
        formData.append('docType', 'lease_agreement');

        try {
          const documentResponse = await axios.post(
            `${BASE_URL}/students/${studentId}/documents`,
            formData,
            {
              ...getAuthHeaders(),
              headers: {
                ...getAuthHeaders().headers,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          console.log('Document upload response:', documentResponse.data);
          documentId = documentResponse.data.id;
        } catch (uploadError) {
          console.error('Error uploading document:', {
            message: uploadError.message,
            response: uploadError.response?.data,
            status: uploadError.response?.status
          });
          throw new Error('Failed to upload lease agreement: ' + (uploadError.response?.data?.message || uploadError.message));
        }
      }

      const payload = {
        roomId: selectedRoom,
        startDate,
        endDate: endDate,
        agreedAmount: parseFloat(monthlyRate),
        adminFee: parseFloat(adminFee || 0),
        securityDeposit: parseFloat(securityDeposit || 0),
        currency: 'USD',
        notes,
        paymentSchedule: paymentSchedules.map(schedule => ({
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          amount: parseFloat(schedule.amount),
          currency: schedule.currency || 'USD',
          notes: schedule.notes || null
        })),
        ...(documentId && { documentId })
      };

      console.log('Submitting payload:', payload);

      if (isUpdate && currentEnrollmentId) {
        console.log('Updating existing room assignment');
        const updateResponse = await axios.put(
          `${BASE_URL}/students/${studentId}/enrollment/${currentEnrollmentId}`,
          payload,
          getAuthHeaders()
        );
        console.log('Update response:', updateResponse.data);
      } else {
        console.log('Creating new room assignment');
        const assignResponse = await axios.post(
          `${BASE_URL}/students/${studentId}/assign-room`,
          payload,
          getAuthHeaders()
        );
        console.log('Assign response:', assignResponse.data);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error in handleSubmit:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
        payload: error.config?.data
      });
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        'Failed to save room assignment. Please try again.'
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setLeaseAgreement(file);
      setSubmitError(null);
    } else {
      setLeaseAgreement(null);
      setSubmitError('Please upload a PDF file');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate(`/dashboard/students/${studentId}`);
  };

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
    <div className="px-4 mt-5 py-8">
      <SuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} isUpdate={isUpdate} />
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-base font-medium text-gray-900">
          {isUpdate ? 'Update Room Assignment' : 'Assign Room'}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {isUpdate ? 'Update room assignment for' : 'Assign a room to'} {student?.full_name}
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Selection */}
        <div className="border border-gray-200">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              {isUpdate ? 'Available Rooms (including current)' : 'Available Rooms'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <label
                  key={room.id}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedRoom === room.id 
                      ? 'border-[#E78D69] bg-[#E78D69]/5'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="room"
                    value={room.id}
                    checked={selectedRoom === room.id}
                    onChange={(e) => {
                      setSelectedRoom(room.id);
                      setMonthlyRate(room.price_per_bed?.toString() || '');
                    }}
                    className="sr-only"
                  />
                  <div className="flex w-full items-start justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          selectedRoom === room.id 
                            ? 'border-[#E78D69] bg-[#E78D69]' 
                            : 'border-gray-300'
                        }`}>
                          {selectedRoom === room.id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          {room.name}
                          {isUpdate && room.id === student?.room_id && ' (Current)'}
                        </span>
                        <span className="mt-1 flex items-center text-xs text-gray-500">
                          {room.floor} • {room.type} • ${room.price_per_bed}/month
                        </span>
                        <span className="mt-1 flex items-center text-xs text-gray-500">
                          {room.available_beds} bed(s) available out of {room.total_beds}
                        </span>
                        {room.amenities && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {room.amenities.split(',').map((amenity, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                              >
                                {amenity.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Arrangement Terms */}
        <div className="border border-gray-200">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Arrangement Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Rent Breakdown */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Rent Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    id="monthlyRent"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="adminFee" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Fee (USD) <span className="text-xs text-gray-500">- Set during enrollment, paid separately</span>
                  </label>
                  <input
                    type="number"
                    name="adminFee"
                    id="adminFee"
                    value={adminFee}
                    onChange={(e) => setAdminFee(e.target.value)}
                    className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit (USD)
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    id="securityDeposit"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">Total Initial Payment:</span>
                  <span className="font-semibold text-gray-900">
                    USD {calculateTotalInitialPayment()}
                  </span>
                </div>
                {parseFloat(adminFee) > 0 && (
                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-500">Admin Fee (paid separately):</span>
                    <span className="font-medium text-gray-500">
                      USD {parseFloat(adminFee || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Schedules Section */}
        <div className="border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
              <h3 className="text-base font-medium text-gray-900">
                Payment Schedules
              </h3>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="inline-flex items-center text-sm text-[#E78D69] hover:text-[#E78D69]/90"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Schedule
              </button>
            </div>
            <div className="space-y-4">
              {paymentSchedules.map((schedule, index) => (
                <div key={schedule.id} className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={schedule.startDate}
                      onChange={(e) => handleScheduleChange(index, 'startDate', e.target.value)}
                      className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={schedule.endDate}
                      onChange={(e) => handleScheduleChange(index, 'endDate', e.target.value)}
                      className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={schedule.amount}
                      onChange={(e) => handleScheduleChange(index, 'amount', e.target.value)}
                      className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={schedule.notes}
                      onChange={(e) => handleScheduleChange(index, 'notes', e.target.value)}
                      className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                      placeholder="Optional notes..."
                    />
                  </div>
                  <div className="flex items-end">
                    {paymentSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(schedule.id)}
                        className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border border-gray-200">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Documents
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Agreement {!isUpdate && <span className="text-red-500">*</span>}
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="lease-agreement"
                    className={`flex items-center justify-center px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-gray-400 ${
                      leaseAgreement ? 'border-[#E78D69] bg-[#E78D69]/5' : 'border-gray-300'
                    }`}
                  >
                    <div className="space-y-1 text-center">
                      <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        {leaseAgreement ? (
                          <span className="text-[#E78D69]">{leaseAgreement.name}</span>
                        ) : (
                          <>
                            <span className="text-[#E78D69]">
                              {isUpdate ? 'Upload new lease agreement (optional)' : 'Upload lease agreement'}
                            </span>
                            <p className="text-xs text-gray-500">PDF only (max. 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    <input
                      id="lease-agreement"
                      name="lease-agreement"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                      required={!isUpdate}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border border-gray-200">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Notes
            </h3>
            <div>
              <textarea
                name="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or comments about this room assignment..."
                className="block w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/dashboard/students')}
            className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#E78D69] hover:bg-[#E78D69]/90"
          >
            {isUpdate ? 'Update Assignment' : 'Assign Room'}
          </button>
        </div>
      </form>
    </div>
  );
} 