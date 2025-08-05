import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  HomeIcon, 
  CreditCardIcon, 
  PlusIcon, 
  XMarkIcon, 
  EyeIcon, 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  NoSymbolIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';
import AddPayment from '../payments/AddPayment';
import Checkout from '../../components/Checkout';
import EnrollmentHistory from './EnrollmentHistory';

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium border-b-2 ${
      active
        ? 'border-[#E78D69] text-[#E78D69]'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <Icon className="h-5 w-5" />
    {label}
  </button>
);

// Sample data for billing and comments
const SAMPLE_PAYMENTS = [
  { 
    id: 1, 
    date: '2025-07-01', 
    type: 'Monthly Rent', 
    amount: 500, 
    currency: 'USD', 
    status: 'Paid'
  },
  { 
    id: 2, 
    date: '2025-06-01', 
    type: 'Monthly Rent', 
    amount: 500, 
    currency: 'USD', 
    status: 'Paid'
  },
  { 
    id: 3, 
    date: '2025-05-01', 
    type: 'Monthly Rent', 
    amount: 500, 
    currency: 'USD', 
    status: 'Paid'
  }
];

export default function ViewStudent() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [payments, setPayments] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    startDate: '',
    endDate: '',
    amount: '',
    currency: 'USD',
    notes: ''
  });
  const [scheduleError, setScheduleError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationNotes, setTerminationNotes] = useState('');
  const [showTerminationConfirm, setShowTerminationConfirm] = useState(false);
  const [checkoutType, setCheckoutType] = useState('end-of-lease'); // or 'early-termination'
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checklistItems, setChecklistItems] = useState({
    payments: { status: 'pending', notes: '' },
    utilities: { status: 'pending', notes: '' },
    damages: { status: 'pending', notes: '' },
    keys: { status: 'pending', notes: '' },
    cleaning: { status: 'pending', notes: '' },
    belongings: { status: 'pending', notes: '' }
  });

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student data
        const studentResponse = await axios.get(
          `${BASE_URL}/students/${studentId}`, 
          getAuthHeaders()
        );
        setStudent(studentResponse.data);
        
        // Fetch payments
        try {
          const paymentsResponse = await axios.get(
            `${BASE_URL}/payments/students/${studentId}`,
            getAuthHeaders()
          );
          setPayments(paymentsResponse.data);
          
          // If student has a room assignment, fetch enrollment details
          if (studentResponse.data.room_id) {
            try {
              const enrollmentResponse = await axios.get(
                `${BASE_URL}/students/${studentId}/enrollment`,
                getAuthHeaders()
              );

              if (enrollmentResponse.data) {
                setStudent(prev => ({
                  ...prev,
                  enrollment_id: enrollmentResponse.data.id,
                  payment_schedules: enrollmentResponse.data.payment_schedules || []
                }));
              }
            } catch (enrollmentError) {
              console.error('Error fetching enrollment:', enrollmentError);
              // Don't set error state for enrollment - it's optional
            }
          }
        } catch (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          setPayments([]); // Set empty payments on error
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.response?.data?.message || 'Failed to load student information');
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleAddPaymentSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');

    try {
      if (!newSchedule.startDate || !newSchedule.endDate || !newSchedule.amount) {
        setScheduleError('Please fill in all required fields');
        return;
      }

      if (!student.enrollment_id) {
        setScheduleError('No active enrollment found');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/payments/students/${studentId}/schedule`,
        {
          startDate: newSchedule.startDate,
          endDate: newSchedule.endDate,
          amount: parseFloat(newSchedule.amount),
          currency: newSchedule.currency,
          notes: newSchedule.notes,
          enrollment_id: student.enrollment_id
        },
        getAuthHeaders()
      );

      // Refresh student data to get updated payment schedules
      const schedulesResponse = await axios.get(
        `${BASE_URL}/payments/students/${studentId}/schedule`,
        getAuthHeaders()
      );

      setStudent(prevStudent => ({
        ...prevStudent,
        payment_schedules: schedulesResponse.data
      }));

      setIsScheduleModalOpen(false);
      setNewSchedule({
        startDate: '',
        endDate: '',
        amount: '',
        currency: 'USD',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding payment schedule:', err);
      setScheduleError(err.response?.data?.message || 'Failed to add payment schedule');
    }
  };

  const renderPaymentScheduleModal = () => (
    isScheduleModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Payment Schedule</h3>
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleAddPaymentSchedule}>
            {scheduleError && (
              <div className="mb-4 text-sm text-red-600">{scheduleError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newSchedule.startDate}
                  onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
                  className="block w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newSchedule.endDate}
                  onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value })}
                  className="block w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newSchedule.amount}
                  onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                  className="block w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={newSchedule.currency}
                  onChange={(e) => setNewSchedule({ ...newSchedule, currency: e.target.value })}
                  className="block w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="block w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:border-[#E78D69] focus:ring-[#E78D69]"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90"
              >
                Add Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    )
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
  
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!student) return <div className="p-4">Student not found</div>;

  const renderPersonalInfo = () => (
    <div className="border border-gray-200">
      <div className="p-6">
        <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Personal Information
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">National ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.national_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.phone_number || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">University</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.university || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.address || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                student.status === 'Active'
                  ? 'text-green-700 bg-green-50 ring-green-600/20'
                  : 'text-gray-700 bg-gray-50 ring-gray-600/20'
              }`}>
                {student.status}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const renderRoomAssignment = () => (
    <div className="border border-gray-200">
      <div className="p-6 space-y-8">
        {/* Room Assignment Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <h3 className="text-base font-medium text-gray-900">Current Room Assignment</h3>
          <button
            onClick={() => navigate(`/dashboard/students/assign-room/${student.id}`)}
            className="text-sm text-[#E78D69] hover:text-[#E78D69]/80"
          >
            {student.room_id ? 'Change Room' : 'Assign Room'}
          </button>
        </div>

        {/* Room Details Section */}
        <div className="bg-white">
          <h4 className="text-xs font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
            Room Details
          </h4>
          {student.room_id ? (
            <div className="space-y-6">
              {/* Basic Room Info */}
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Room Information</h5>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{student.room_name}</span>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    student.status === 'Active' 
                      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                  }`}>
                    {student.status || 'Status Not Set'}
                  </span>
                </div>
              </div>

              {/* Rent Breakdown */}
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Rent Breakdown</h5>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500">Monthly Rent</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {student.currency} {student.agreed_amount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Admin Fee</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {student.currency} {student.admin_fee || '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Security Deposit</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {student.currency} {student.security_deposit || '0.00'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Total Initial Payment</span>
                    <span className="text-sm font-medium text-gray-900">
                      {student.currency} {(
                        parseFloat(student.agreed_amount || 0) +
                        parseFloat(student.admin_fee || 0) +
                        parseFloat(student.security_deposit || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lease Period */}
              <div>
                <h5 className="text-xs font-medium text-gray-500 mb-2">Lease Period</h5>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(student.start_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(student.expected_end_date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Notes */}
              {student.notes && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Additional Notes</h5>
                  <p className="text-sm text-gray-900">{student.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500">No room currently assigned</p>
              <button
                onClick={() => navigate(`/dashboard/students/assign-room/${student.id}`)}
                className="mt-2 text-sm text-[#E78D69] hover:text-[#E78D69]/80 font-medium"
              >
                Assign a Room
              </button>
            </div>
          )}
        </div>

        {/* Payment Schedule Section */}
        {student.room_id && (
          <div className="bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-medium text-gray-900">Payment Schedule</h4>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center text-xs text-[#E78D69] hover:text-[#E78D69]/90"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Schedule
              </button>
            </div>
            {student.payment_schedules?.length > 0 ? (
              <div className="border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Period</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Start Date</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">End Date</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Amount</th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.payment_schedules.map((schedule, index) => (
                      <tr key={schedule.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          Period {index + 1}
                          {schedule.notes && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{schedule.notes}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {new Date(schedule.period_start_date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {new Date(schedule.period_end_date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {schedule.currency} {parseFloat(schedule.amount_due).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">No payment schedule available</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Section */}
        <div className="bg-white">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Documents</h4>
          {student.documents?.length > 0 ? (
            <div className="border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {student.documents.map((doc) => (
                  <li key={doc.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.doc_type}</p>
                      <p className="text-sm text-gray-500">{doc.file_path.split('/').pop()}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-4">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                      <a 
                        href={`${BASE_URL}/${doc.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-500 border border-gray-200 p-4">No documents uploaded</div>
          )}
        </div>
      </div>
      {renderPaymentScheduleModal()}
    </div>
  );

  const getPaymentScheduleDetails = (payment) => {
    if (!student.payment_schedules) return null;
    return student.payment_schedules.find(schedule => 
      schedule.id === payment.schedule_id
    );
  };

  const PaymentDetailsModal = ({ payment, onClose }) => {
    const schedule = getPaymentScheduleDetails(payment);
    const remainingAmount = schedule ? parseFloat(schedule.amount_due) - parseFloat(schedule.amount_paid) : 0;

    return (
      <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50">
        <div className="bg-white shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          {/* Modal Header */}
          <div className="bg-[#0a192f] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="text-lg font-medium">Payment Details</h3>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Payment Information Section */}
            <div>
              <h4 className="text-sm font-medium text-[#0a192f] mb-2 pb-1 border-b border-gray-200">
                Payment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Reference Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.reference_number || `PMT-${payment.id}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Payment Type</p>
                  <p className="text-sm font-medium text-gray-900">Rent Payment</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Payment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {payment.payment_method}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium
                    ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Details Section */}
            {schedule && (
              <div>
                <h4 className="text-sm font-medium text-[#0a192f] mb-2 pb-1 border-b border-gray-200">
                  Schedule Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Period</p>
                    <div className="text-sm font-medium text-gray-900">
                      <p>{new Date(schedule.period_start_date).toLocaleDateString()}</p>
                      <p className="text-gray-500 text-xs">to</p>
                      <p>{new Date(schedule.period_end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Amount Due</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.currency} {parseFloat(schedule.amount_due).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Amount Paid</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.currency} {parseFloat(schedule.amount_paid).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Remaining Balance</p>
                    <p className={`text-sm font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {schedule.currency} {remainingAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {payment.notes && (
              <div>
                <h4 className="text-sm font-medium text-[#0a192f] mb-2 pb-1 border-b border-gray-200">
                  Notes
                </h4>
                <div className="bg-gray-50 p-3">
                  <p className="text-sm text-gray-900">{payment.notes}</p>
                </div>
              </div>
            )}

            {/* Receipt Section */}
            <div>
              <h4 className="text-sm font-medium text-[#0a192f] mb-2 pb-1 border-b border-gray-200">
                Receipt
              </h4>
              <div className="bg-gray-50 p-3">
                {payment.receipt_path ? (
                  <a
                    href={`${BASE_URL}/api/uploads/payment-receipts/${payment.receipt_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#0a192f] hover:text-[#0a192f]/80"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">Download Receipt</span>
                  </a>
                ) : (
                  <label className="inline-flex items-center cursor-pointer text-[#0a192f] hover:text-[#0a192f]/80">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">Upload Receipt</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleReceiptUpload(e, payment.id)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white bg-[#0a192f] hover:bg-[#0a192f]/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBilling = () => {
    console.log('Rendering billing section with student data:', student);
    console.log('Current payments:', payments);
    
    return (
      <div className="border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
            <h3 className="text-base font-medium text-gray-900">Payment History</h3>
          </div>
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Reference</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Period</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Fee Type</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Method</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Amount</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {payment.reference_number || `PMT-${payment.id}`}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {payment.period_start_date && payment.period_end_date ? (
                          <>
                            {new Date(payment.period_start_date).toLocaleDateString()} -<br/>
                            {new Date(payment.period_end_date).toLocaleDateString()}
                          </>
                        ) : 'One-time Payment'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <span className="capitalize">{(payment.payment_type || 'monthly_rent').replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <span className="capitalize">{payment.payment_method}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsPaymentDetailsModalOpen(true);
                            }}
                            className="text-[#0a192f] hover:text-[#0a192f]/80 p-1 rounded-full hover:bg-gray-100"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {payment.receipt_path ? (
                            <a
                              href={`${BASE_URL}/uploads/${payment.receipt_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0a192f] hover:text-[#0a192f]/80 p-1 rounded-full hover:bg-gray-100"
                              title="Download Receipt"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </a>
                          ) : (
                            <label 
                              className="cursor-pointer text-[#0a192f] hover:text-[#0a192f]/80 p-1 rounded-full hover:bg-gray-100"
                              title="Upload Receipt"
                            >
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleReceiptUpload(e, payment.id)}
                              />
                              <DocumentArrowUpIcon className="h-4 w-4" />
                            </label>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">No payment history available</p>
            </div>
          )}

          {/* Payment Details Modal */}
          {isPaymentDetailsModalOpen && selectedPayment && (
            <PaymentDetailsModal
              payment={selectedPayment}
              onClose={() => {
                setSelectedPayment(null);
                setIsPaymentDetailsModalOpen(false);
              }}
            />
          )}

          {/* Add Payment Form */}
          <div className="mt-8">
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-xs font-medium text-gray-900 mb-4">Add New Payment</h4>
              <AddPayment 
                studentId={student.id}
                studentName={student.full_name}
                paymentSchedules={student.payment_schedules || []}
                feeTypes={[
                  { id: 'monthly_rent', label: 'Monthly Rent' },
                  { id: 'admin_fee', label: 'Admin Fee', amount: student.admin_fee },
                  { id: 'security_deposit', label: 'Security Deposit', amount: student.security_deposit },
                  { id: 'additional_charges', label: 'Additional Charges' }
                ]}
                adminFee={student.admin_fee}
                securityDeposit={student.security_deposit}
                currency={student.currency}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleReceiptUpload = async (e, paymentId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      await axios.post(
        `${BASE_URL}/payments/${paymentId}/receipt`,
        formData,
        {
          ...getAuthHeaders(),
          headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Refresh payment data
      const response = await axios.get(`${BASE_URL}/students/${studentId}`, getAuthHeaders());
      setStudent(response.data);
    } catch (err) {
      console.error('Error uploading receipt:', err);
      // You might want to add error state and display it to the user
    }
  };

  const updateChecklistItem = (key, status, notes) => {
    setChecklistItems(prev => ({
      ...prev,
      [key]: { status, notes }
    }));
  };

  const isCheckoutReady = () => {
    return Object.values(checklistItems).every(item => item.status !== 'pending');
  };

  const renderCheckout = () => (
    <Checkout
      studentId={studentId}
      onCancel={() => setActiveTab('room')}
      onSuccess={(data) => {
        // Update student status locally
        setStudent(prev => ({
          ...prev,
          status: 'Inactive',
          room_name: null,
          room_id: null
        }));
        // Show success message
        toast.success(`Checkout completed successfully for room ${data.room_name}`);
        // Switch back to room tab
        setActiveTab('room');
      }}
    />
  );

  const CheckoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    const hasFailedItems = Object.values(checklistItems).some(item => item.status === 'failed');

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            {hasFailedItems ? (
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-2" />
            ) : (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {hasFailedItems ? 'Warning: Failed Checklist Items' : 'Confirm Checkout'}
            </h3>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {hasFailedItems
                ? 'Some checklist items have failed. Are you sure you want to proceed with the checkout?'
                : 'All checklist items are complete. Proceed with the checkout?'}
            </p>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white ${
                hasFailedItems ? 'bg-red-600 hover:bg-red-700' : 'bg-[#E78D69] hover:bg-[#E78D69]/90'
              }`}
            >
              {hasFailedItems ? 'Proceed Anyway' : 'Complete Checkout'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCheckout = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/students/${studentId}/checkout`,
        {
          checkoutType,
          checkoutDate,
          terminationReason: checkoutType === 'early-termination' ? terminationReason : null,
          notes: checkoutNotes,
          checklist: checklistItems
        },
        getAuthHeaders()
      );

      if (response.data) {
        // Refresh student data
        const studentResponse = await axios.get(`${BASE_URL}/students/${studentId}`, getAuthHeaders());
        setStudent(studentResponse.data);
        setShowConfirmModal(false);
        setActiveTab('room'); // Switch back to room tab
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      // Handle error appropriately
    }
  };

  const handleTermination = async (terminationData) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/students/${studentId}/terminate-room`,
        terminationData,
        getAuthHeaders()
      );

      if (response.data) {
        // Refresh student data
        const studentResponse = await axios.get(`${BASE_URL}/students/${studentId}`, getAuthHeaders());
        setStudent(studentResponse.data);
        setActiveTab('room'); // Switch back to room tab
      }
    } catch (error) {
      console.error('Error processing termination:', error);
      // Handle error appropriately
    }
  };

  const renderTermination = () => (
    <Checkout
      onCancel={() => setActiveTab('room')}
      onSubmit={handleTermination}
    />
  );

  return (
    <div className="px-4 mt-5 py-8 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-base font-medium text-gray-900">Student Information</h2>
        <p className="mt-1 text-xs text-gray-500">
          View detailed information for {student.full_name}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            active={activeTab === 'personal'}
            icon={UserIcon}
            label="Personal Info"
            onClick={() => setActiveTab('personal')}
          />
          <TabButton
            active={activeTab === 'room'}
            icon={HomeIcon}
            label="Room Assignment"
            onClick={() => setActiveTab('room')}
          />
          <TabButton
            active={activeTab === 'billing'}
            icon={CreditCardIcon}
            label="Billing"
            onClick={() => setActiveTab('billing')}
          />
          <TabButton
            active={activeTab === 'history'}
            icon={ClockIcon}
            label="History"
            onClick={() => setActiveTab('history')}
          />
          {student?.room_id && (
            <TabButton
              active={activeTab === 'checkout'}
              icon={NoSymbolIcon}
              label="Checkout"
              onClick={() => setActiveTab('checkout')}
            />
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'room' && renderRoomAssignment()}
        {activeTab === 'billing' && renderBilling()}
        {activeTab === 'history' && <EnrollmentHistory />}
        {activeTab === 'checkout' && (
          <Checkout
            studentId={studentId}
            onCancel={() => setActiveTab('room')}
            onSuccess={(data) => {
              setStudent(prev => ({
                ...prev,
                status: 'Inactive',
                room_name: null,
                room_id: null
              }));
              toast.success(`Checkout completed successfully for room ${data.room_name}`);
              setActiveTab('room');
            }}
          />
        )}
      </div>

      {/* Checkout Confirmation Modal */}
      <CheckoutConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleCheckout}
      />
    </div>
  );
} 