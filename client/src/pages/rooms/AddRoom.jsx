import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import {
  ArrowLeftIcon,
  HomeIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function AddRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [formData, setFormData] = useState({
    room_name: '',
    boarding_house_id: '',
    monthly_rent: '',
    description: '',
    status: 'available'
  });
  const [beds, setBeds] = useState([]);
  const [newBed, setNewBed] = useState({
    bed_number: '',
    price: '',
    notes: '',
    image: null
  });
  const [roomImages, setRoomImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
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

  const handleAddBed = () => {
    if (!newBed.bed_number || !newBed.price) {
      alert('Please fill in bed number and price');
      return;
    }
    setBeds([...beds, { ...newBed, id: Date.now() }]);
    setNewBed({ bed_number: '', price: '', notes: '', image: null });
  };

  const handleBedImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewBed({ ...newBed, image: file });
    }
  };

  const handleRemoveBedImage = () => {
    setNewBed({ ...newBed, image: null });
  };

  const handleRemoveBed = (index) => {
    setBeds(beds.filter((_, i) => i !== index));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setRoomImages([...roomImages, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setRoomImages(roomImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.room_name.trim()) {
      newErrors.room_name = 'Room name is required';
    }

    if (!formData.boarding_house_id) {
      newErrors.boarding_house_id = 'Please select a boarding house';
    }

    if (beds.length === 0) {
      newErrors.beds = 'At least one bed is required';
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
      // Step 1: Create the room
      const roomData = {
        name: formData.room_name.trim(),
        description: formData.description?.trim() || '',
        boarding_house_id: parseInt(formData.boarding_house_id),
        status: formData.status,
        capacity: beds.length, // Set capacity based on number of beds
        rent: beds.length > 0 ? parseFloat(beds[0].price) : 0 // Use first bed price as default
      };

      if (isNaN(roomData.boarding_house_id) || roomData.boarding_house_id <= 0) {
        throw new Error('Invalid boarding house selection');
      }

      console.log('Creating room with data:', roomData);
      
      const roomResponse = await axios.post(`${BASE_URL}/rooms`, roomData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const roomId = roomResponse.data.id || roomResponse.data.room_id;
      console.log('Room created successfully:', roomResponse.data);

      // Step 2: Create all beds and upload bed images
      if (beds.length > 0) {
        const createdBeds = [];
        for (const bed of beds) {
          try {
            // Create the bed first
            const bedResponse = await axios.post(`${BASE_URL}/beds`, {
              room_id: roomId,
              bed_number: bed.bed_number,
              price: parseFloat(bed.price),
              notes: bed.notes || '',
              status: 'available'
            }, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const bedId = bedResponse.data.id;
            createdBeds.push(bedResponse.data);

            // Upload bed image if provided
            if (bed.image) {
              try {
                const bedImageFormData = new FormData();
                bedImageFormData.append('bedImage', bed.image);

                await axios.post(`${BASE_URL}/beds/${bedId}/image`, bedImageFormData, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                  }
                });
                console.log(`Bed image uploaded for bed ${bed.bed_number}`);
              } catch (bedImageError) {
                console.error(`Error uploading image for bed ${bed.bed_number}:`, bedImageError);
                // Continue even if image upload fails
              }
            }
          } catch (bedError) {
            console.error('Error creating bed:', bedError);
            // Continue with other beds even if one fails
          }
        }
        
        // Update room capacity to match actual number of beds created
        if (createdBeds.length > 0) {
          try {
            await axios.put(`${BASE_URL}/rooms/${roomId}`, {
              capacity: createdBeds.length,
              available_beds: createdBeds.length
            }, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
          } catch (updateError) {
            console.error('Error updating room capacity:', updateError);
            // Don't fail the entire operation
          }
        }
      }

      // Step 3: Upload room images
      if (roomImages.length > 0) {
        const imageFormData = new FormData();
        roomImages.forEach(file => {
          imageFormData.append('images', file);
        });

        try {
          const imageResponse = await axios.post(`${BASE_URL}/rooms/${roomId}/images`, imageFormData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log('Room images uploaded successfully:', imageResponse.data);
        } catch (imageError) {
          console.error('Error uploading room images:', imageError);
          console.error('Image upload error details:', {
            message: imageError.message,
            status: imageError.response?.status,
            data: imageError.response?.data
          });
          // Don't fail the entire operation if images fail to upload
          // User can upload images later from the room details page
        }
      }

      navigate('/dashboard/rooms');
    } catch (err) {
      console.error('Error creating room:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
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
            Create a new room in a boarding house with beds and images
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
                      : 'border-gray-300 focus:ring-[#f58020] focus:border-[#f58020]'
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
                      : 'border-gray-300 focus:ring-[#f58020] focus:border-[#f58020]'
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
                  className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
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
                  className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                  placeholder="Optional description of the room..."
                />
              </div>
            </div>

            {/* Beds Section */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-medium text-gray-700">
                  Beds *
                </label>
                {errors.beds && (
                  <p className="text-xs text-red-600">{errors.beds}</p>
                )}
              </div>
              
              {/* Add Bed Form */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bed Number *
                    </label>
                    <input
                      type="text"
                      value={newBed.bed_number}
                      onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                      placeholder="e.g., A1, B2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newBed.price}
                      onChange={(e) => setNewBed({ ...newBed, price: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={newBed.notes}
                      onChange={(e) => setNewBed({ ...newBed, notes: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                
                {/* Bed Image Upload */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bed Image (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBedImageSelect}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    {newBed.image && (
                      <button
                        type="button"
                        onClick={handleRemoveBedImage}
                        className="text-red-600 hover:text-red-800"
                        title="Remove image"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {newBed.image && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(newBed.image)}
                        alt="Bed preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddBed}
                  className="mt-3 px-3 py-2 bg-[#f58020] text-white text-xs rounded hover:bg-[#f58020]/90"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Add Bed
                </button>
              </div>

              {/* Beds List */}
              {beds.length > 0 && (
                <div className="space-y-2">
                  {beds.map((bed, index) => (
                    <div key={bed.id || index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        {bed.image && (
                          <img
                            src={bed.image instanceof File ? URL.createObjectURL(bed.image) : bed.image}
                            alt={`Bed ${bed.bed_number}`}
                            className="w-12 h-12 object-cover rounded border border-gray-200"
                          />
                        )}
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-900">{bed.bed_number}</span>
                          <span className="text-xs text-gray-500 ml-2">${parseFloat(bed.price).toFixed(2)}</span>
                          {bed.notes && (
                            <span className="text-xs text-gray-400 ml-2">- {bed.notes}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBed(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Images Section */}
            <div className="border-t border-gray-200 pt-5">
              <label className="block text-xs font-medium text-gray-700 mb-4">
                Room Images
              </label>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#f58020] file:text-white hover:file:bg-[#f58020]/90"
                />
                <p className="mt-1 text-xs text-gray-500">You can select multiple images at once</p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/rooms')}
                className="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 border border-transparent text-xs font-medium text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020] disabled:opacity-50 disabled:cursor-not-allowed"
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
