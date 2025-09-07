import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

export default function AddStudent() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [boardingHouses, setBoardingHouses] = useState([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    university: '',
    gender: 'Female',
    address: '',
    phoneNumber: '',
    boardingHouseId: ''
  });

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      setError('Failed to fetch boarding houses');
    }
  };

  useEffect(() => {
    if (token) {
      fetchBoardingHouses();
    }
  }, [token]);

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
        fullName: formData.fullName,
        nationalId: formData.nationalId,
        university: formData.university || null,
        gender: formData.gender || 'Female',
        address: formData.address || null,
        phoneNumber: formData.phoneNumber || null,
        boardingHouseId: formData.boardingHouseId || null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Add New Student</h1>
          <p className="text-xs text-gray-500">Enter student information to create a new record</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="flex items-center px-4 py-2 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Students
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="nationalId" className="block text-xs font-medium text-gray-700 mb-1">
                  National ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationalId"
                  id="nationalId"
                  required
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="university" className="block text-xs font-medium text-gray-700 mb-1">
                  University/Course
                </label>
                <input
                  type="text"
                  name="university"
                  id="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-xs font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="boardingHouseId" className="block text-xs font-medium text-gray-700 mb-1">
                  Boarding House <span className="text-red-500">*</span>
                </label>
                <select
                  name="boardingHouseId"
                  id="boardingHouseId"
                  required
                  value={formData.boardingHouseId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Boarding House</option>
                  {boardingHouses.map(bh => (
                    <option key={bh.id} value={bh.id}>
                      {bh.name} - {bh.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/students')}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#f58020' }}
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 