import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const BedsAndRooms = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [bedsData, setBedsData] = useState({});
  const [loadingBeds, setLoadingBeds] = useState({});

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedHouse) {
      fetchRooms(selectedHouse);
    }
  }, [selectedHouse]);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoardingHouses(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (boardingHouseId) => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms/boarding-house/${boardingHouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const toggleRoom = async (roomId) => {
    const isExpanding = !expandedRooms[roomId];
    
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));

    // Fetch bed details when expanding
    if (isExpanding && !bedsData[roomId]) {
      await fetchBedsForRoom(roomId);
    }
  };

  const fetchBedsForRoom = async (roomId) => {
    setLoadingBeds(prev => ({ ...prev, [roomId]: true }));
    try {
      const response = await axios.get(`${BASE_URL}/beds/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBedsData(prev => ({
        ...prev,
        [roomId]: response.data || []
      }));
    } catch (error) {
      console.error('Error fetching beds for room:', error);
      setBedsData(prev => ({
        ...prev,
        [roomId]: []
      }));
    } finally {
      setLoadingBeds(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getBedImageUrl = (bedId) => {
    return `${BASE_URL}/beds/${bedId}/image`;
  };

  const getOccupancyColor = (occupied, total) => {
    if (total === 0) return 'bg-gray-100 text-gray-800';
    const percentage = (occupied / total) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58020]"></div>
        </div>
      </Layout>
    );
  }

  // Calculate totals
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((sum, room) => sum + (room.bedInfo?.totalBeds || 0), 0);
  const occupiedBeds = rooms.reduce((sum, room) => sum + (room.bedInfo?.occupiedBeds || 0), 0);
  const availableBeds = rooms.reduce((sum, room) => sum + (room.bedInfo?.availableBeds || 0), 0);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Beds and Rooms</h1>
          <p className="mt-0.5 text-xs text-gray-500">View beds and rooms across all boarding houses</p>
        </div>

        {/* Boarding House Selector */}
        <div className="bg-white p-3 border border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">Select Boarding House</label>
          <select
            value={selectedHouse || ''}
            onChange={(e) => setSelectedHouse(parseInt(e.target.value))}
            className="w-full text-xs border border-gray-300 px-2 py-1"
          >
            {boardingHouses.map(house => (
              <option key={house.id} value={house.id}>
                {house.name} - {house.location}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Rooms</p>
            <p className="text-base font-bold text-gray-900">{totalRooms}</p>
          </div>
          <div className="bg-white p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Beds</p>
            <p className="text-base font-bold text-gray-900">{totalBeds}</p>
          </div>
          <div className="bg-white p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Occupied Beds</p>
            <p className="text-base font-bold text-blue-600">{occupiedBeds}</p>
          </div>
          <div className="bg-white p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Occupancy Rate</p>
            <p className="text-base font-bold text-purple-600">{occupancyRate}%</p>
          </div>
        </div>

        {/* Rooms List */}
        <div className="bg-white border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Rooms - {boardingHouses.find(h => h.id === selectedHouse)?.name || 'All'}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {rooms.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-gray-500">No rooms found for this boarding house</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{room.name}</h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium ${getOccupancyColor(
                            room.bedInfo?.occupiedBeds || 0,
                            room.bedInfo?.totalBeds || 0
                          )}`}
                        >
                          {room.status || 'Available'}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Beds:</span>{' '}
                          {room.bedInfo?.occupiedBeds || 0} / {room.bedInfo?.totalBeds || 0}
                        </div>
                        <div>
                          <span className="font-medium">Available:</span>{' '}
                          {room.bedInfo?.availableBeds || 0}
                        </div>
                        {room.bedInfo?.averagePrice > 0 && (
                          <div>
                            <span className="font-medium">Avg Price:</span>{' '}
                            {formatCurrency(room.bedInfo.averagePrice)}
                          </div>
                        )}
                        {room.rent > 0 && (
                          <div>
                            <span className="font-medium">Rent:</span> {formatCurrency(room.rent)}
                          </div>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-xs text-gray-500 mt-1">{room.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleRoom(room.id)}
                      className="ml-4 text-xs text-[#f58020] hover:text-[#e6701a]"
                    >
                      {expandedRooms[room.id] ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  {expandedRooms[room.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {/* Room Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                        <div>
                          <p className="text-gray-500">Capacity</p>
                          <p className="font-medium text-gray-900">{room.capacity || 'N/A'}</p>
                        </div>
                        {room.adminFee > 0 && (
                          <div>
                            <p className="text-gray-500">Admin Fee</p>
                            <p className="font-medium text-gray-900">{formatCurrency(room.adminFee)}</p>
                          </div>
                        )}
                        {room.securityDeposit > 0 && (
                          <div>
                            <p className="text-gray-500">Security Deposit</p>
                            <p className="font-medium text-gray-900">{formatCurrency(room.securityDeposit)}</p>
                          </div>
                        )}
                        {room.bedInfo?.minPrice > 0 && room.bedInfo?.maxPrice > 0 && (
                          <div>
                            <p className="text-gray-500">Price Range</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(room.bedInfo.minPrice)} - {formatCurrency(room.bedInfo.maxPrice)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Beds List */}
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Beds in this Room</h5>
                        {loadingBeds[room.id] ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f58020] mx-auto"></div>
                            <p className="text-xs text-gray-500 mt-2">Loading beds...</p>
                          </div>
                        ) : bedsData[room.id] && bedsData[room.id].length > 0 ? (
                          <div className="grid grid-cols-3 gap-3">
                            {bedsData[room.id].map((bed) => (
                              <div
                                key={bed.id}
                                className={`border ${
                                  bed.status === 'occupied'
                                    ? 'border-blue-200 bg-blue-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                {/* Bed Image */}
                                {bed.bed_image ? (
                                  <div>
                                    <img 
                                      src={getBedImageUrl(bed.id)} 
                                      alt={`Bed ${bed.bed_number || bed.id}`}
                                      className="w-full h-32 object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No image</span>
                                  </div>
                                )}
                                {/* Bed Info */}
                                <div className="p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-gray-900">
                                      {bed.bed_number || `Bed ${bed.id}`}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 text-xs font-medium ${
                                        bed.status === 'occupied'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {bed.status === 'occupied' ? 'Occupied' : 'Available'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {formatCurrency(bed.price || 0)}
                                  </div>
                                  {bed.status === 'occupied' && bed.student_name && (
                                    <div className="text-xs font-medium text-gray-900 mt-1 pt-1 border-t border-gray-200">
                                      {bed.student_name}
                                    </div>
                                  )}
                                  {bed.status === 'available' && (
                                    <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-200">
                                      Available
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 py-2">No beds found for this room</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BedsAndRooms;

