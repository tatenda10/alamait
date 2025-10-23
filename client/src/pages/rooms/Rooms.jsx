import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');

  useEffect(() => {
    fetchBoardingHouses();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedBoardingHouse]);

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

  const fetchRooms = async () => {
    try {
      let url = `${BASE_URL}/rooms/all`;
      if (selectedBoardingHouse !== 'all') {
        url = `${BASE_URL}/rooms/boarding-house/${selectedBoardingHouse}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Transform the data to match the frontend expectations
      const transformedRooms = response.data.map(room => {
        
        return {
          id: room.id,
          room_name: room.name,
          name: room.name,
          capacity: room.capacity,
          currentOccupants: room.currentOccupants || 0,
          monthly_rent: room.rent || 0,
          rent: room.rent || 0,
          currency: 'US$',
          description: room.description,
          status: room.status || 'Available',
          boarding_house_name: room.boarding_house_name || 'Unknown Boarding House',
          boarding_house_id: room.boarding_house_id,
          // Add bed information for better status calculation
          totalBeds: room.bedInfo?.totalBeds || 0,
          occupiedBeds: room.bedInfo?.occupiedBeds || 0,
          availableBeds: room.bedInfo?.availableBeds || 0
        };
      });
      
      setRooms(transformedRooms);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms');
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`${BASE_URL}/rooms/${roomId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchRooms(); // Refresh the list
      } catch (err) {
        console.error('Error deleting room:', err);
        alert('Failed to delete room');
      }
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.boarding_house_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    
    // If a specific boarding house is selected, the API already filters by boarding house
    // If "all" is selected, we show all rooms (no additional filtering needed)
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Rooms Management</h1>
            <p className="text-xs text-gray-500">
              Manage all rooms across boarding houses
            </p>
          </div>
          <Link
            to="/dashboard/rooms/add"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-xs font-medium text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Room
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search rooms or boarding houses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 text-xs leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={selectedBoardingHouse}
            onChange={(e) => setSelectedBoardingHouse(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
          >
            <option value="all">All Boarding Houses</option>
            {boardingHouses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full sm:w-48 px-3 py-2 border border-gray-300 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#f58020] focus:border-[#f58020]"
        >
          <option value="all">All Status</option>
          <option value="Available">Available</option>
          <option value="Fully Occupied">Fully Occupied</option>
          <option value="Partially Occupied">Partially Occupied</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="bg-white shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <li key={room.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HomeIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-xs font-medium text-gray-900">
                          {room.room_name || room.name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 text-xs font-medium
                          ${room.status === 'Available'
                            ? 'bg-green-100 text-green-800'
                            : room.status === 'Fully Occupied'
                            ? 'bg-red-100 text-red-800'
                            : room.status === 'Partially Occupied'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(room.status === 'Available') && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                          {room.status || 'Available'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {room.boarding_house_name || 'Unknown Boarding House'}
                        {room.current_student && (
                          <>
                            <span className="mx-2">•</span>
                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {room.current_student}
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Capacity: {room.capacity} • Monthly Rent: {room.currency || 'US$'} {parseFloat(room.monthly_rent || room.rent || 0).toFixed(2)}
                        {room.currentOccupants !== undefined && (
                          <span> • Occupants: {room.currentOccupants}/{room.capacity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/dashboard/rooms/${room.id}`}
                      className="text-[#f58020] hover:text-[#f58020]/80"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/dashboard/rooms/${room.id}/edit`}
                      className="text-blue-600 hover:text-blue-500"
                      title="Edit Room"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="text-red-600 hover:text-red-500"
                      title="Delete Room"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center">
              <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xs font-medium text-gray-900">No rooms found</h3>
              <p className="mt-1 text-xs text-gray-500">
                {searchTerm || filterStatus !== 'all' || selectedBoardingHouse !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new room.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && selectedBoardingHouse === 'all' && (
                <div className="mt-6">
                  <Link
                    to="/dashboard/rooms/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-xs font-medium text-white bg-[#f58020] hover:bg-[#f58020]/90"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Room
                  </Link>
                </div>
              )}
            </li>
          )}
        </ul>
      </div>

      {/* Summary Stats */}
      {filteredRooms.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">Available Rooms</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {filteredRooms.filter(room => 
                        room.status === 'Available'
                      ).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">Occupied Rooms</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {filteredRooms.filter(room => 
                        room.status === 'Fully Occupied'
                      ).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">Partial Occupancy</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {filteredRooms.filter(room => 
                        room.status === 'Partially Occupied'
                      ).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">Total Rooms</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {filteredRooms.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}