import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const BedSelector = ({ roomId, selectedBedId, onBedSelect, disabled = false }) => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roomId) {
      fetchBeds();
    }
  }, [roomId]);

  const fetchBeds = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/beds/room/${roomId}/public`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBeds(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching beds:', error);
      setError('Failed to load beds');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅';
      case 'occupied': return '❌';
      case 'maintenance': return '🔧';
      case 'reserved': return '🔒';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Select Bed</h4>
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Select Bed</h4>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  const availableBeds = beds.filter(bed => bed.status === 'available');

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Select Bed</h4>
      
      {availableBeds.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No available beds in this room</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {availableBeds.map((bed) => (
            <button
              key={bed.id}
              onClick={() => onBedSelect(bed.id)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedBedId === bed.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{bed.bed_number}</div>
                  <div className="text-xs text-gray-500">${parseFloat(bed.price).toFixed(2)}/month</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{getStatusIcon(bed.status)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                    {bed.status}
                  </span>
                </div>
              </div>
              {bed.notes && (
                <div className="mt-1 text-xs text-gray-600">{bed.notes}</div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {beds.length > availableBeds.length && (
        <div className="mt-3">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Other Beds (Not Available)</h5>
          <div className="space-y-1">
            {beds.filter(bed => bed.status !== 'available').map((bed) => (
              <div key={bed.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span>{bed.bed_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                  {bed.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BedSelector;
