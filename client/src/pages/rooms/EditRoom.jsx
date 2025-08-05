import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import {
  ArrowLeftIcon,
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    fetchRoom();
    fetchBoardingHouses();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Handle new API response structure
      const room = response.data.success ? response.data.data : response.data;
      
      setFormData({
        room_name: room.room_name || room.name || '',
        boarding_house_id: room.boarding_house_id || '',
        capacity: room.capacity || 1,
        monthly_rent: room.monthly_rent || room.price_per_bed || '',
        description: room.description || '',
        amenities: room.amenities || '',
        status: room.status || 'available'
      });
      setInitialLoading(false);
    } catch (err) {
      console.error('Error fetching room:', err);
      alert('Failed to load room details');
      navigate('/dashboard/rooms');
    }
  };

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
      await axios.put(`${BASE_URL}/rooms/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      navigate(`/dashboard/rooms/${id}`);
    } catch (err) {
      console.error('Error updating room:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert('Failed to update room. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 w-1/4 mb-4"></div>
          <div className="bg-white shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 w-3/4"></div>
              <div className="h-4 bg-gray-200 w-1/2"></div>
              <div className="h-4 bg-gray-200 w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      <div className="mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Edit Room</h1>
          <p className="mt-1 text-xs text-gray-500">
            Update room information and settings
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 border border-transparent text-xs font-medium text-white bg-[#E78D69] hover:bg-[#d17a5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78D69] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}