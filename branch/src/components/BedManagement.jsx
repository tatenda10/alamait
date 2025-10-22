import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../utils/api';

const BedManagement = ({ roomId, roomName, onBedUpdate }) => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedBedForImage, setSelectedBedForImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [newBed, setNewBed] = useState({
    bed_number: '',
    price: '',
    notes: '',
    status: 'available'
  });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    fetchBeds();
  }, [roomId]);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/beds/room/${roomId}`);
      setBeds(response.data || []);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setError('Failed to load beds');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingBed) {
      setEditingBed(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewBed(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bedData = {
        room_id: roomId,
        bed_number: editingBed ? editingBed.bed_number : newBed.bed_number,
        price: parseFloat(editingBed ? editingBed.price : newBed.price),
        notes: (editingBed ? editingBed.notes : newBed.notes).trim(),
        status: editingBed ? editingBed.status : newBed.status
      };

      if (editingBed) {
        await api.put(`/beds/${editingBed.id}`, bedData);
      } else {
        await api.post('/beds', bedData);
      }

      await fetchBeds();
      if (onBedUpdate) onBedUpdate();
      setShowAddModal(false);
      setEditingBed(null);
      setNewBed({
        bed_number: '',
        price: '',
        notes: '',
        status: 'available'
      });
    } catch (error) {
      console.error('Error saving bed:', error);
      setError(error.response?.data?.message || 'Failed to save bed');
    }
  };

  const handleEdit = (bed) => {
    setEditingBed(bed);
    setShowAddModal(true);
  };

  const handleDelete = async (bedId) => {
    if (window.confirm('Are you sure you want to delete this bed?')) {
      try {
        await api.delete(`/beds/${bedId}`);
        await fetchBeds();
        if (onBedUpdate) onBedUpdate();
      } catch (error) {
        console.error('Error deleting bed:', error);
        setError('Failed to delete bed');
      }
    }
  };

  const handleImageSelect = (bed, file) => {
    setSelectedBedForImage(bed);
    setSelectedImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile || !selectedBedForImage) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('bedImage', selectedImageFile);

      await api.post(`/beds/${selectedBedForImage.id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      await fetchBeds();
      if (onBedUpdate) onBedUpdate();
      handleCancelImageUpload();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelImageUpload = () => {
    setSelectedBedForImage(null);
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const handleDeleteImage = async (bedId) => {
    if (window.confirm('Are you sure you want to delete this bed image?')) {
      try {
        await api.delete(`/beds/${bedId}/image`);
        await fetchBeds();
        if (onBedUpdate) onBedUpdate();
      } catch (error) {
        console.error('Error deleting image:', error);
        setError('Failed to delete image');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'occupied':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'maintenance':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      case 'reserved':
        return 'text-blue-700 bg-blue-50 ring-blue-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading beds...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bed Management</h3>
            <p className="text-sm text-gray-500">Manage beds for {roomName}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E78D69] hover:bg-[#E78D69]/90"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Bed
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {beds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.map((bed) => (
              <div key={bed.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Bed {bed.bed_number}</h4>
                    <p className="text-sm text-gray-500">${bed.price}/month</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(bed.status)}`}>
                    {bed.status}
                  </span>
                </div>

                {bed.notes && (
                  <p className="text-xs text-gray-600 mb-3">{bed.notes}</p>
                )}

                {/* Bed Image */}
                <div className="mb-3">
                  {bed.bed_image ? (
                    <div className="relative">
                      <img
                        src={`${BASE_URL}/beds/${bed.id}/image`}
                        alt={`Bed ${bed.bed_number}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeleteImage(bed.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(bed)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleImageSelect(bed, null)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PhotoIcon className="h-3 w-3 mr-1" />
                    {bed.bed_image ? 'Change' : 'Add'} Image
                  </button>
                  <button
                    onClick={() => handleDelete(bed.id)}
                    className="px-3 py-2 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No beds found</h3>
            <p className="text-sm text-gray-500 mb-4">Get started by adding beds to this room.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E78D69] hover:bg-[#E78D69]/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Bed
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Bed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingBed ? 'Edit Bed' : 'Add New Bed'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number*</label>
                <input
                  type="text"
                  name="bed_number"
                  value={editingBed ? editingBed.bed_number : newBed.bed_number}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)*</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={editingBed ? editingBed.price : newBed.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editingBed ? editingBed.status : newBed.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editingBed ? editingBed.notes : newBed.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBed(null);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#E78D69] text-white px-4 py-2 rounded hover:bg-[#E78D69]/90"
                >
                  {editingBed ? 'Save Changes' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {selectedBedForImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Bed Image</h3>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleImageSelect(selectedBedForImage, file);
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={uploadingImage}
              />
            </div>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleCancelImageUpload}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              {selectedImageFile && (
                <button
                  onClick={handleImageUpload}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : 'Save Image'}
                </button>
              )}
            </div>
            
            {uploadingImage && (
              <div className="mt-4 text-center text-blue-600">
                Uploading image...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;
