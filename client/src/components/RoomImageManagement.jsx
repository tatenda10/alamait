import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PhotoIcon, 
  TrashIcon, 
  StarIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const BASE_URL = 'http://localhost:5000/api';

const RoomImageManagement = ({ roomId, roomName, onImageUpdate }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchImages();
    }
  }, [roomId]);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms/${roomId}/images`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setImages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room images:', error);
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Create previews
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target.result);
        if (previews.length === files.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      await axios.post(`${BASE_URL}/rooms/${roomId}/images`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset states
      setSelectedFiles([]);
      setImagePreviews([]);
      setShowUploadModal(false);
      
      fetchImages();
      if (onImageUpdate) onImageUpdate();
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDisplayImage = async (imageId) => {
    try {
      await axios.put(`${BASE_URL}/rooms/${roomId}/images/${imageId}/set-display`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchImages();
    } catch (error) {
      console.error('Error setting display image:', error);
      alert('Failed to set display image');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await axios.delete(`${BASE_URL}/rooms/${roomId}/images/${imageId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchImages();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image');
      }
    }
  };

  const getImageUrl = (imageId) => {
    return `${BASE_URL}/rooms/${roomId}/images/${imageId}`;
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading images...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Room Images - {roomName}</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Images
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="relative">
                <img 
                  src={getImageUrl(image.id)} 
                  alt={`Room image ${image.id}`}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                
                {/* Display Image Badge */}
                {image.is_display_image && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Display
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex space-x-2">
                {!image.is_display_image ? (
                  <button
                    onClick={() => handleSetDisplayImage(image.id)}
                    className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 flex items-center justify-center"
                  >
                    <StarIcon className="h-4 w-4 mr-1" />
                    Set Display
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetDisplayImage(image.id)}
                    className="flex-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 flex items-center justify-center"
                  >
                    <StarIcon className="h-4 w-4 mr-1" />
                    Change Display
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center justify-center"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No images uploaded yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add images to showcase this room</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Room Images</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">You can select multiple images at once</p>
            </div>
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <img 
                      key={index}
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                disabled={uploading}
              >
                Cancel
              </button>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleUpload}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </button>
              )}
            </div>
            
            {uploading && (
              <div className="mt-4 text-center text-blue-600">
                Uploading images...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomImageManagement;
