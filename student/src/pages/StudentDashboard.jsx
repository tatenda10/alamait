import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, 
  HomeIcon, 
  CreditCardIcon, 
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilIcon,
  CogIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../utils/api';
import ChangePassword from '../components/ChangePassword';

const StudentDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeaseAgreement, setShowLeaseAgreement] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signatureSubmitted, setSignatureSubmitted] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!student) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('studentToken');
    fetchStudentData(token);
  }, [student, navigate]);

  const fetchStudentData = async (token) => {
    try {
      // Fetch payments and invoices in parallel
      const [paymentsResponse, invoicesResponse] = await Promise.all([
        fetch(`${BASE_URL}/students/${student.id}/payments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${BASE_URL}/students/${student.id}/invoices-dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData || []);
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData || []);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSignatureCapture = (signatureData) => {
    setSignature(signatureData);
  };

  const clearSignature = () => {
    setSignature(null);
  };

  const submitSignature = async () => {
    if (!signature) return;
    
    try {
      const token = localStorage.getItem('studentToken');
      const response = await fetch(`${BASE_URL}/students/${student.id}/sign-lease`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signature_data: signature
        })
      });

      if (response.ok) {
        setSignatureSubmitted(true);
        alert('Lease agreement signed successfully!');
      } else {
        alert('Failed to submit signature. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('Failed to submit signature. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your dashboard...</h2>
          <p className="text-gray-600">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Student Portal</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Mobile Settings Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-white hover:text-blue-100 bg-white/10 px-2 py-1 rounded-lg transition-all duration-200 hover:bg-white/20">
                    <CogIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                    >
                      <LockClosedIcon className="h-4 w-4 mr-2 text-blue-600" />
                      Change Password
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-white hover:text-red-200 bg-red-500/20 px-2 py-1 rounded-lg transition-all duration-200 hover:bg-red-500/30"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Mobile User Info */}
            <div className="pb-4">
              <div className="text-white font-semibold text-sm">{student?.full_name}</div>
              <div className="text-blue-100 text-xs">ID: {student?.student_id}</div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Student Portal</h1>
                  <p className="text-blue-100 text-sm">Accommodation Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-white font-semibold">{student?.full_name}</div>
                <div className="text-blue-100 text-sm">ID: {student?.student_id}</div>
              </div>
              
              {/* Settings Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-blue-100 bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                  <CogIcon className="h-5 w-5" />
                  <span>Settings</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <LockClosedIcon className="h-4 w-4 mr-3 text-blue-600" />
                    Change Password
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-white hover:text-red-200 bg-red-500/20 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-red-500/30"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {student?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Here's your accommodation overview and recent activity.</p>
        </div>

        {/* Student Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Personal Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Information</h3>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">ID: {student?.student_id}</p>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-blue-200">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Name:</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{student?.full_name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-blue-200">
                <span className="text-xs sm:text-sm font-medium text-gray-600">National ID:</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 break-all">{student?.national_id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-blue-200">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Phone:</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{student?.phone_number || 'Not provided'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Status:</span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold mt-1 sm:mt-0 ${
                  student?.status === 'Active' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {student?.status}
                </span>
              </div>
            </div>
          </div>

          {/* Room Assignment Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-green-200">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <HomeIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Room Assignment</h3>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Current accommodation</p>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {student?.room_name ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Room:</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{student.room_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Monthly Rent:</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{student.currency} {student.agreed_amount}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Start Date:</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {student.start_date ? new Date(student.start_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-3 sm:py-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <HomeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">No room assigned</p>
                  <p className="text-xs text-gray-400 mt-1">Contact administration for room assignment</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Balance Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-purple-200 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <CreditCardIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Account Balance</h3>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Current balance</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {student?.currency || 'USD'} {student?.account_balance || '0.00'}
              </div>
              <div className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                parseFloat(student?.account_balance || 0) >= 0 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  parseFloat(student?.account_balance || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {parseFloat(student?.account_balance || 0) >= 0 ? 'Credit Balance' : 'Outstanding Balance'}
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Payment History</h3>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Your recent payments and transactions</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {payments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{payment.notes || payment.payment_type || 'Payment'}</p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg sm:text-lg font-bold text-gray-900">
                        {student?.currency || 'USD'} {payment.amount}
                      </p>
                      <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Completed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Your payment history will appear here once payments are recorded.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Invoices</h3>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Your billing invoices and charges</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {invoices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            #{invoice.reference_number?.slice(-4) || 'INV'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{invoice.description}</p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {student?.currency || 'USD'} {invoice.amount}
                      </p>
                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : invoice.status === 'overdue' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          invoice.status === 'paid' ? 'bg-green-500' : 
                          invoice.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <DocumentTextIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Your invoices will appear here once they are generated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lease Agreement - Only show if student has a room assignment */}
        {student?.room_id && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Lease Agreement</h3>
                  <p className="text-sm text-gray-500">Review and sign your accommodation lease agreement</p>
                </div>
                {signatureSubmitted ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Signed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLeaseAgreement(!showLeaseAgreement)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    {showLeaseAgreement ? 'Hide Agreement' : 'View Agreement'}
                  </button>
                )}
              </div>
            </div>
            
            {showLeaseAgreement && !signatureSubmitted && (
              <div className="p-6">
                {/* Lease Agreement Content */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="max-h-96 overflow-y-auto space-y-4 text-sm text-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 text-center">STUDENT ACCOMMODATION LEASE AGREEMENT</h4>
                    
                    <div className="space-y-3">
                      <p><strong>Property:</strong> {student.room_name}</p>
                      <p><strong>Student:</strong> {student.full_name}</p>
                      <p><strong>Student ID:</strong> {student.student_id}</p>
                      <p><strong>National ID:</strong> {student.national_id}</p>
                      <p><strong>Phone:</strong> {student.phone_number}</p>
                      <p><strong>Lease Period:</strong> {student.start_date ? new Date(student.start_date).toLocaleDateString() : 'N/A'} to {student.expected_end_date ? new Date(student.expected_end_date).toLocaleDateString() : 'Ongoing'}</p>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold">TERMS AND CONDITIONS:</h5>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>The student agrees to pay monthly rent as agreed upon enrollment.</li>
                        <li>The student shall maintain the room in good condition and report any damages immediately.</li>
                        <li>No smoking, alcohol, or illegal substances are permitted on the premises.</li>
                        <li>Quiet hours are from 10 PM to 7 AM on weekdays and 11 PM to 8 AM on weekends.</li>
                        <li>Visitors must be registered and are not permitted to stay overnight.</li>
                        <li>The student is responsible for their personal belongings and security.</li>
                        <li>Any breach of these terms may result in termination of the lease.</li>
                      </ol>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold">PAYMENT TERMS:</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Monthly rent: {student.currency} {student.agreed_amount}</li>
                        <li>Admin fee: {student.currency} {student.admin_fee || '20.00'} (one-time)</li>
                        <li>Security deposit: {student.currency} {student.security_deposit || '0.00'}</li>
                        <li>Monthly rent is due on the 1st of each month</li>
                        <li>Late payments may incur additional charges</li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500">
                        By signing below, I acknowledge that I have read, understood, and agree to all terms and conditions of this lease agreement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Digital Signature *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="text-center">
                      {signature ? (
                        <div className="space-y-4">
                          <div className="bg-white border border-gray-200 rounded p-4 min-h-20 flex items-center justify-center">
                            <img src={signature} alt="Signature" className="max-h-16" />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                            >
                              Clear Signature
                            </button>
                            <button
                              type="button"
                              onClick={submitSignature}
                              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                            >
                              Submit Signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">Click to sign the lease agreement</p>
                          <button
                            type="button"
                            onClick={() => {
                              // Simple signature capture using canvas
                              const canvas = document.createElement('canvas');
                              canvas.width = 300;
                              canvas.height = 100;
                              canvas.style.border = '1px solid #ccc';
                              canvas.style.cursor = 'crosshair';
                              
                              const ctx = canvas.getContext('2d');
                              ctx.strokeStyle = '#000';
                              ctx.lineWidth = 2;
                              
                              let isDrawing = false;
                              
                              canvas.addEventListener('mousedown', (e) => {
                                isDrawing = true;
                                ctx.beginPath();
                                ctx.moveTo(e.offsetX, e.offsetY);
                              });
                              
                              canvas.addEventListener('mousemove', (e) => {
                                if (isDrawing) {
                                  ctx.lineTo(e.offsetX, e.offsetY);
                                  ctx.stroke();
                                }
                              });
                              
                              canvas.addEventListener('mouseup', () => {
                                isDrawing = false;
                              });
                              
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                              modal.innerHTML = `
                                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                  <h3 class="text-lg font-semibold mb-4">Sign Lease Agreement</h3>
                                  <div class="text-center">
                                    <canvas id="signature-canvas"></canvas>
                                  </div>
                                  <div class="mt-4 flex space-x-2">
                                    <button id="save-signature" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Save Signature</button>
                                    <button id="cancel-signature" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400">Cancel</button>
                                  </div>
                                </div>
                              `;
                              
                              document.body.appendChild(modal);
                              const canvasElement = modal.querySelector('#signature-canvas');
                              canvasElement.width = 300;
                              canvasElement.height = 100;
                              canvasElement.style.border = '1px solid #ccc';
                              canvasElement.style.cursor = 'crosshair';
                              
                              const canvasCtx = canvasElement.getContext('2d');
                              canvasCtx.strokeStyle = '#000';
                              canvasCtx.lineWidth = 2;
                              
                              let drawing = false;
                              
                              canvasElement.addEventListener('mousedown', (e) => {
                                drawing = true;
                                canvasCtx.beginPath();
                                canvasCtx.moveTo(e.offsetX, e.offsetY);
                              });
                              
                              canvasElement.addEventListener('mousemove', (e) => {
                                if (drawing) {
                                  canvasCtx.lineTo(e.offsetX, e.offsetY);
                                  canvasCtx.stroke();
                                }
                              });
                              
                              canvasElement.addEventListener('mouseup', () => {
                                drawing = false;
                              });
                              
                              modal.querySelector('#save-signature').addEventListener('click', () => {
                                const signatureData = canvasElement.toDataURL();
                                handleSignatureCapture(signatureData);
                                document.body.removeChild(modal);
                              });
                              
                              modal.querySelector('#cancel-signature').addEventListener('click', () => {
                                document.body.removeChild(modal);
                              });
                            }}
                            className="w-full py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <PencilIcon className="h-4 w-4 inline mr-2" />
                            Sign Here
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {signatureSubmitted && (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">Lease Agreement Signed</h3>
                  <p className="text-sm text-green-700">
                    Your lease agreement has been successfully signed and submitted. You can now proceed with your accommodation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default StudentDashboard;
