import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import {
  ArrowLeftIcon,
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function AddRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [formData, setFormData] = useState({
    room_name: '',
    boarding_house_id: '',
    capacity: 1,
    monthly_rent: '',
    description: '',
    amenities: '',
    status: 'available'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBoardingHouses(response.data);
    } catch (err) {
      console.error('Error fetching boarding houses:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.room_name.trim()) {
      newErrors.room_name = 'Room name is required';
    }

    if (!formData.boarding_house_id) {
      newErrors.boarding_house_id = 'Please select a boarding house';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.monthly_rent || parseFloat(formData.monthly_rent) <= 0) {
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Transform form data to match backend expectations
      const roomData = {
        name: formData.room_name.trim(),
        capacity: parseInt(formData.capacity),
        rent: parseFloat(formData.monthly_rent),
        description: formData.description?.trim() || '',
        boarding_house_id: parseInt(formData.boarding_house_id)
      };

      // Additional validation for transformed data
      if (isNaN(roomData.capacity) || roomData.capacity < 1) {
        throw new Error('Invalid capacity value');
      }

      if (isNaN(roomData.rent) || roomData.rent <= 0) {
        throw new Error('Invalid rent value');
      }

      if (isNaN(roomData.boarding_house_id) || roomData.boarding_house_id <= 0) {
        throw new Error('Invalid boarding house selection');
      }

      console.log('Submitting room data:', roomData);
      
      const response = await axios.post(`${BASE_URL}/rooms`, roomData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Room created successfully:', response.data);
      navigate('/dashboard/rooms');
    } catch (err) {
      console.error('Error creating room:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
          data: err.config?.data
        }
      });
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        alert(`Failed to create room: ${err.response.data.message}`);
      } else if (err.message) {
        alert(`Failed to create room: ${err.message}`);
      } else {
        alert('Failed to create room. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Add New Room</h1>
          <p className="mt-1 text-xs text-gray-500">
            Create a new room in a boarding house
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full">
        <div className="bg-white">
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Room Name */}
            <div>
              <label htmlFor="room_name" className="block text-xs font-medium text-gray-700">
                Room Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HomeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="room_name"
                  name="room_name"
                  value={formData.room_name}
                  onChange={handleInputChange}
                  className={`block w-full pl-9 pr-3 py-2 border text-xs focus:outline-none focus:ring-1 ${
                    errors.room_name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#E78D69] focus:border-[#E78D69]'
                  }`}
                  placeholder="e.g., Room 101, Deluxe Suite A"
                />
              </div>
              {errors.room_name && (
                <p className="mt-1 text-xs text-red-600">{errors.room_name}</p>
              )}
            </div>

            {/* Boarding House */}
            <div>
              <label htmlFor="boarding_house_id" className="block text-xs font-medium text-gray-700">
                Boarding House *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="boarding_house_id"
                  name="boarding_house_id"
                  value={formData.boarding_house_id}
                  onChange={handleInputChange}
                  className={`block w-full pl-9 pr-3 py-2 border text-xs focus:outline-none focus:ring-1 ${
                    errors.boarding_house_id
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#E78D69] focus:border-[#E78D69]'
                  }`}
                >
                  <option value="">Select a boarding house</option>
                  {boardingHouses.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.boarding_house_id && (
                <p className="mt-1 text-xs text-red-600">{errors.boarding_house_id}</p>
              )}
            </div>

            {/* Capacity and Monthly Rent */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="capacity" className="block text-xs font-medium text-gray-700">
                  Capacity *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={`block w-full pl-9 pr-3 py-2 border text-xs focus:outline-none focus:ring-1 ${
                      errors.capacity
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#E78D69] focus:border-[#E78D69]'
                    }`}
                    placeholder="1"
                  />
                </div>
                {errors.capacity && (
                  <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
                )}
              </div>

              <div>
                <label htmlFor="monthly_rent" className="block text-xs font-medium text-gray-700">
                  Monthly Rent *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="monthly_rent"
                    name="monthly_rent"
                    step="0.01"
                    min="0"
                    value={formData.monthly_rent}
                    onChange={handleInputChange}
                    className={`block w-full pl-9 pr-3 py-2 border text-xs focus:outline-none focus:ring-1 ${
                      errors.monthly_rent
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#E78D69] focus:border-[#E78D69]'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.monthly_rent && (
                  <p className="mt-1 text-xs text-red-600">{errors.monthly_rent}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
                  placeholder="Optional description of the room..."
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label htmlFor="amenities" className="block text-xs font-medium text-gray-700">
                Amenities
              </label>
              <div className="mt-1">
                <textarea
                  id="amenities"
                  name="amenities"
                  rows={2}
                  value={formData.amenities}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
                  placeholder="e.g., Air conditioning, WiFi, Private bathroom..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/rooms')}
                className="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 border border-transparent text-xs font-medium text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}