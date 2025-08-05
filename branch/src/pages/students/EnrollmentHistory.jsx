import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../utils/api';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export default function EnrollmentHistory() {
  const { studentId } = useParams();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/students/${studentId}/enrollments`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setEnrollments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError('Failed to load enrollment history');
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [studentId]);

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

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6">
        <h2 className="text-base font-medium text-gray-900">Enrollment History</h2>
        <p className="mt-1 text-sm text-gray-500">
          View all room assignments and enrollment details
        </p>
      </div>

      <div className="space-y-6">
        {enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <div 
              key={enrollment.id} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HomeIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900">
                      Room {enrollment.room_name}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${enrollment.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : enrollment.status === 'terminated'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {enrollment.status === 'active' && <CheckCircleIcon className="mr-1 h-4 w-4" />}
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Lease Period */}
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Lease Period
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div>{new Date(enrollment.start_date).toLocaleDateString()}</div>
                      <div className="text-gray-500">to</div>
                      <div>{new Date(enrollment.expected_end_date).toLocaleDateString()}</div>
                    </dd>
                  </div>

                  {/* Rent Details */}
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Monthly Rent
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {enrollment.currency} {parseFloat(enrollment.agreed_amount).toFixed(2)}
                    </dd>
                  </div>

                  {/* Admin Fee */}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Admin Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {enrollment.currency} {parseFloat(enrollment.admin_fee || 0).toFixed(2)}
                    </dd>
                  </div>

                  {/* Security Deposit */}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Security Deposit</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {enrollment.currency} {parseFloat(enrollment.security_deposit || 0).toFixed(2)}
                    </dd>
                  </div>
                </dl>

                {/* Checkout Details */}
                {enrollment.checkout_date && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Checkout Details</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Checkout Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(enrollment.checkout_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Reason</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {enrollment.checkout_reason}
                        </dd>
                      </div>
                      {enrollment.checkout_notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {enrollment.checkout_notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No enrollment history found</p>
          </div>
        )}
      </div>
    </div>
  );
} 