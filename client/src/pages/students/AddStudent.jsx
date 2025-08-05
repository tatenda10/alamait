import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../utils/api';
export default function AddStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    idNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    course: '',
    yearLevel: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${BASE_URL}/students`, {
        idNumber: formData.idNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        guardianName: formData.guardianName || null,
        guardianPhone: formData.guardianPhone || null,
        address: formData.address,
        course: formData.course,
        yearLevel: formData.yearLevel
      });

      navigate('/dashboard/students');
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/students')}
          className="inline-flex items-center gap-x-1.5 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Students
        </button>
        <h2 className="text-base font-medium text-gray-900">Add New Student</h2>
        <p className="mt-1 text-xs text-gray-500">
          Enter student information to create a new record
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Information */}
        <div className="border border-gray-200">
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  id="idNumber"
                  required
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="border border-gray-200">
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  id="course"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Year Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="yearLevel"
                  id="yearLevel"
                  required
                  value={formData.yearLevel}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Year Level</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Guardian Information (Optional) */}
        <div className="border border-gray-200">
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
              Guardian Information (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className="block w-full border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
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
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#E78D69] hover:bg-[#E78D69]/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
} 