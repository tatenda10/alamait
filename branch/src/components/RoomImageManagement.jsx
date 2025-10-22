import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  TrashIcon, 
  StarIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../utils/api';

const RoomImageManagement = ({ roomId, roomName, onImageUpdate }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    fetchImages();
  }, [roomId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/rooms/${roomId}/images`);
      setImages(response.data || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await api.post(`/rooms/${roomId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      await fetchImages();
      if (onImageUpdate) onImageUpdate();
      handleCancelUpload();
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleSetDisplayImage = async (imageId) => {
    try {
      await api.put(`/rooms/${roomId}/images/${imageId}/set-display`);
      await fetchImages();
      if (onImageUpdate) onImageUpdate();
    } catch (error) {
      console.error('Error setting display image:', error);
      setError('Failed to set display image');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await api.delete(`/rooms/${roomId}/images/${imageId}`);
        await fetchImages();
        if (onImageUpdate) onImageUpdate();
      } catch (error) {
        console.error('Error deleting image:', error);
        setError('Failed to delete image');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading images...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Room Images</h3>
            <p className="text-sm text-gray-500">Manage images for {roomName}</p>
          </div>
          <label className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E78D69] hover:bg-[#E78D69]/90 cursor-pointer">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Upload Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Images ({selectedFiles.length})</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </button>
              <button
                onClick={handleCancelUpload}
                disabled={uploading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={`${BASE_URL}/rooms/${roomId}/images/${image.id}`}
                    alt={`Room image ${image.id}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                {/* Display Badge */}
                {image.is_display_image && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Display
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {!image.is_display_image && (
                      <button
                        onClick={() => handleSetDisplayImage(image.id)}
                        className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                        title="Set as display image"
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                    )}
                    {image.is_display_image && (
                      <button
                        onClick={() => handleSetDisplayImage(image.id)}
                        className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                        title="Change display image"
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Delete image"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {image.is_display_image ? 'Display Image' : 'Room Image'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(image.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No images found</h3>
            <p className="text-sm text-gray-500 mb-4">Add images to showcase this room.</p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#E78D69] hover:bg-[#E78D69]/90 cursor-pointer">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Image
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomImageManagement;
