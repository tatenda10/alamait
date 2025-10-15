import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  MapPinIcon,
  Squares2X2Icon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../../context/Api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, pagination.page]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`${BASE_URL}/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id, status, adminNotes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status, 
          admin_notes: adminNotes,
          auto_assign_room: status === 'approved' // Automatically assign room when approving
        })
      });

      if (!response.ok) {
        let errMsg = 'Failed to update application status';
        try {
          const err = await response.json();
          if (err?.message) errMsg = err.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      // Refresh applications
      fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
      
      // Show success message
      if (status === 'approved') {
        alert('Application approved! Student has been automatically registered and room assigned.');
      } else {
        alert(`Application status updated to ${status}.`);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(error?.message || 'Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      case 'under_review': return <EyeIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
        <p className="text-gray-600">Manage incoming student applications</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room & Bed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{app.student_name}</div>
                        <div className="text-sm text-gray-500">{app.email}</div>
                        <div className="text-sm text-gray-500">{app.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{app.room_name}</div>
                        <div className="text-sm text-gray-500">{app.boarding_house_name}</div>
                        {app.bed_number && (
                          <div className="text-sm text-gray-500">Bed {app.bed_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.institution}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1 capitalize">{app.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Student Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedApplication.student_name}</span>
                      </div>
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedApplication.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedApplication.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedApplication.institution}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Room Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedApplication.room_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">{selectedApplication.boarding_house_name}</div>
                      {selectedApplication.bed_number && (
                        <div className="flex items-center">
                          <Squares2X2Icon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">Bed {selectedApplication.bed_number}</span>
                        </div>
                      )}
                      {selectedApplication.bed_price && (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">${selectedApplication.bed_price}/month</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Information</h4>
                    <div className="space-y-2">
                      {selectedApplication.preferred_move_in_date && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            Preferred move-in: {formatDate(selectedApplication.preferred_move_in_date)}
                          </span>
                        </div>
                      )}
                      {selectedApplication.emergency_contact_name && (
                        <div>
                          <div className="text-sm font-medium text-gray-900">Emergency Contact</div>
                          <div className="text-sm text-gray-600">{selectedApplication.emergency_contact_name}</div>
                          <div className="text-sm text-gray-600">{selectedApplication.emergency_contact_phone}</div>
                          <div className="text-sm text-gray-600">{selectedApplication.emergency_contact_relationship}</div>
                        </div>
                      )}
                      {selectedApplication.medical_history && (
                        <div>
                          <div className="text-sm font-medium text-gray-900">Medical History</div>
                          <div className="text-sm text-gray-600">{selectedApplication.medical_history}</div>
                        </div>
                      )}
                      {selectedApplication.additional_notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-900">Additional Notes</div>
                          <div className="text-sm text-gray-600">{selectedApplication.additional_notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                  disabled={selectedApplication.status === 'approved'}
                  className={`px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 ${selectedApplication.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Reject
                </button>
                <button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'under_review')}
                  disabled={selectedApplication.status === 'approved'}
                  className={`px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 ${selectedApplication.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Under Review
                </button>
                <button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                  disabled={selectedApplication.status === 'approved'}
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${selectedApplication.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
