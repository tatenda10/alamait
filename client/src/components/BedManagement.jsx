import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const BedManagement = ({ roomId, roomName, onBedUpdate }) => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBed, setShowAddBed] = useState(false);
  const [newBed, setNewBed] = useState({
    bedNumber: '',
    price: '',
    notes: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedBedForImage, setSelectedBedForImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (roomId) {
      fetchBeds();
    }
  }, [roomId]);

  const fetchBeds = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/beds/room/${roomId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBeds(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching beds:', error);
      setLoading(false);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating bed with data:', {
        roomId,
        bedNumber: newBed.bedNumber,
        price: parseFloat(newBed.price),
        notes: newBed.notes
      });
      
      const response = await axios.post(`${BASE_URL}/beds`, {
        room_id: roomId,
        bed_number: newBed.bedNumber,
        price: parseFloat(newBed.price),
        notes: newBed.notes,
        status: 'available'
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Bed created successfully:', response.data);
      
      setNewBed({ bedNumber: '', price: '', notes: '' });
      setShowAddBed(false);
      fetchBeds();
      if (onBedUpdate) onBedUpdate();
    } catch (error) {
      console.error('Error adding bed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to add bed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateBed = async (bedId, updates) => {
    try {
      await axios.put(`${BASE_URL}/beds/${bedId}`, updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchBeds();
      if (onBedUpdate) onBedUpdate();
    } catch (error) {
      console.error('Error updating bed:', error);
      alert('Failed to update bed');
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (window.confirm('Are you sure you want to delete this bed?')) {
      try {
        await axios.delete(`${BASE_URL}/beds/${bedId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchBeds();
        if (onBedUpdate) onBedUpdate();
      } catch (error) {
        console.error('Error deleting bed:', error);
        alert('Failed to delete bed');
      }
    }
  };

  const handleImageSelect = (bedId, file) => {
    setSelectedBedForImage(bedId);
    setSelectedImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedBedForImage || !selectedImageFile) return;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('bedImage', selectedImageFile);

      await axios.post(`${BASE_URL}/beds/${selectedBedForImage}/image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset states
      setSelectedBedForImage(null);
      setSelectedImageFile(null);
      setImagePreview(null);
      
      fetchBeds();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
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
        await axios.delete(`${BASE_URL}/beds/${bedId}/image`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchBeds();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image');
      }
    }
  };

  const getImageUrl = (bedId) => {
    return `${BASE_URL}/beds/${bedId}/image`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading beds...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Beds in {roomName}</h3>
        <button
          onClick={() => setShowAddBed(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Bed
        </button>
      </div>

      {showAddBed && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-3">Add New Bed</h4>
          <form onSubmit={handleAddBed} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bed Number</label>
                <input
                  type="text"
                  value={newBed.bedNumber}
                  onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., A1, B2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBed.price}
                  onChange={(e) => setNewBed({ ...newBed, price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={newBed.notes}
                onChange={(e) => setNewBed({ ...newBed, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="2"
                placeholder="Optional notes about this bed"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Bed
              </button>
              <button
                type="button"
                onClick={() => setShowAddBed(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beds.map((bed) => (
          <div key={bed.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-lg">{bed.bed_number}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                {bed.status}
              </span>
            </div>
            
            {/* Bed Image */}
            {bed.bed_image ? (
              <div className="mb-3">
                <img 
                  src={getImageUrl(bed.id)} 
                  alt={`Bed ${bed.bed_number}`}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="mt-1 flex space-x-1">
                  <button
                    onClick={() => setSelectedBedForImage(bed.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={() => handleDeleteImage(bed.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No image</span>
                </div>
                <button
                  onClick={() => setSelectedBedForImage(bed.id)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  Add Image
                </button>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="font-semibold">${parseFloat(bed.price).toFixed(2)}</span>
              </div>
              
              {bed.student_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Student:</span>
                  <span className="text-sm font-medium">{bed.student_name}</span>
                </div>
              )}
              
              {bed.notes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {bed.notes}
                </div>
              )}
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  const newPrice = prompt('Enter new price:', bed.price);
                  if (newPrice && !isNaN(newPrice)) {
                    handleUpdateBed(bed.id, { price: parseFloat(newPrice) });
                  }
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Price
              </button>
              
              {bed.status === 'available' && (
                <button
                  onClick={() => handleDeleteBed(bed.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {beds.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No beds found for this room. Add a bed to get started.
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
