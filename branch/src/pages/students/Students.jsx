import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  HomeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    university: '',
    gender: 'Female',
    address: '',
    phoneNumber: '',
    joinedAt: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('Auth token:', token);
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
      // Ensure we always set an array, even if the response is empty or invalid
      setStudents(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]); // Ensure students is an empty array on error
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/students/${studentId}`, getAuthHeaders());
      fetchStudents(); // Refresh the list
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Always set gender to Female
      const studentData = {
        ...formData,
        gender: 'Female'
      };
      
      console.log('Submitting student data:', studentData);
      console.log('Headers:', getAuthHeaders());
      
      const response = await axios.post(`${BASE_URL}/students`, studentData, getAuthHeaders());
      console.log('API Response:', response.data);
      
      setIsModalOpen(false);
      setFormData({
        fullName: '',
        nationalId: '',
        university: '',
        gender: 'Female',
        address: '',
        phoneNumber: '',
        joinedAt: '',
        status: 'Active'
      });
      fetchStudents();
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        requestData: err.config?.data
      });
      alert(`Failed to add student: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
                </div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Students</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Manage student information and room assignments
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="block bg-[#E78D69] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
          >
            <PlusIcon className="inline-block h-4 w-4 mr-1" />
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/4">
                    Name / ID
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/4">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/6">
                    Room
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 text-right text-xs font-medium text-gray-900 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="py-2 pl-4 pr-3 text-xs text-gray-900 border-x border-gray-200">
                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                        <div className="text-gray-500">{student.id_number}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                        <div>{student.email}</div>
                        <div>{student.phone_number}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                        {student.room_name || 'Not Assigned'}
                      </td>
                      <td className="px-3 py-2 text-xs border-r border-gray-200">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          student.status === 'Active' 
                            ? 'text-green-700 bg-green-50 ring-green-600/20'
                            : 'text-gray-700 bg-gray-50 ring-gray-600/20'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium border-r border-gray-200">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/dashboard/students/view/${student.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Student"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {!student.room_name && (
                            <button 
                              onClick={() => navigate(`/dashboard/students/assign-room/${student.id}`)}
                              className="text-[#E78D69] hover:text-[#E78D69]/80"
                              title="Assign Room"
                            >
                              <HomeIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => navigate(`/dashboard/students/edit/${student.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Student"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Student"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-4 text-sm text-gray-500 text-center">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 " onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/85 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden bg-white px-4 pb-4 pt-5 text-left shadow-lg transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div className="absolute right-0 top-0 pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-3">
                        Add New Student
                      </Dialog.Title>
                      <form onSubmit={handleSubmit} className="mt-6">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="fullName"
                              id="fullName"
                              required
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-900">
                              National ID
                            </label>
                            <input
                              type="text"
                              name="nationalId"
                              id="nationalId"
                              required
                              value={formData.nationalId}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="university" className="block text-sm font-medium text-gray-900">
                              University
                            </label>
                            <input
                              type="text"
                              name="university"
                              id="university"
                              required
                              value={formData.university}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              id="phoneNumber"
                              required
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-900">
                              Address
                            </label>
                            <textarea
                              name="address"
                              id="address"
                              rows={3}
                              required
                              value={formData.address}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border border-gray-300 bg-gray-50 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="joinedAt" className="block text-sm font-medium text-gray-900">
                              Join Date
                            </label>
                            <input
                              type="date"
                              name="joinedAt"
                              id="joinedAt"
                              required
                              value={formData.joinedAt}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                              Status
                            </label>
                            <select
                              name="status"
                              id="status"
                              required
                              value={formData.status}
                              onChange={handleInputChange}
                              className="mt-2 block w-full border-0 border-b border-gray-300 bg-gray-50 py-1.5 text-gray-900 focus:border-[#E78D69] focus:outline-none focus:ring-0 sm:text-sm"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-8 border-t border-gray-200 pt-5">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              className="inline-flex justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                              onClick={() => setIsModalOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="inline-flex justify-center bg-[#E78D69] px-4 py-2 text-sm font-medium text-white hover:bg-[#E78D69]/90 focus:outline-none"
                            >
                              Add Student
                            </button>
                          </div>
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
    </div>
  );
}