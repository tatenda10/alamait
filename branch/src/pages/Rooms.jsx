import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../utils/api';

export default function Rooms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [roomBeds, setRoomBeds] = useState({});
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    rent: '',
    adminFee: '',
    securityDeposit: '',
    additionalRent: '',
    description: ''
  });

  const boardingHouseId = localStorage.getItem('boarding_house_id') || '';
  const token = localStorage.getItem('token');

  // Create axios instance with default config
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    if (boardingHouseId) {
      fetchRooms();
    } else {
      setLoading(false);
      setError('No boarding house selected');
    }
  }, [boardingHouseId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/rooms/boarding-house/${boardingHouseId}`);
      
      if (response.data && (Array.isArray(response.data) || Array.isArray(response.data.data))) {
        const roomsData = Array.isArray(response.data) ? response.data : response.data.data;
        setRooms(roomsData);
        
        // Fetch beds for each room
        await fetchBedsForRooms(roomsData);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setRooms([]);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Room management is currently under development. Please try again later.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBedsForRooms = async (roomsData) => {
    try {
      const bedsPromises = roomsData.map(async (room) => {
        try {
          // Try the public endpoint first
          const bedsResponse = await api.get(`/beds/room/${room.id}/public`);
          console.log(`Beds for room ${room.id}:`, bedsResponse.data);
          return { roomId: room.id, beds: bedsResponse.data || [] };
        } catch (err) {
          console.error(`Error fetching beds for room ${room.id}:`, err);
          // If public endpoint fails, try without authentication
          try {
            const bedsResponse = await axios.get(`${BASE_URL}/beds/room/${room.id}/public`);
            console.log(`Beds for room ${room.id} (no auth):`, bedsResponse.data);
            return { roomId: room.id, beds: bedsResponse.data || [] };
          } catch (err2) {
            console.error(`Error fetching beds for room ${room.id} (no auth):`, err2);
            return { roomId: room.id, beds: [] };
          }
        }
      });

      const bedsResults = await Promise.all(bedsPromises);
      const bedsMap = {};
      bedsResults.forEach(({ roomId, beds }) => {
        bedsMap[roomId] = beds;
      });
      console.log('Final beds map:', bedsMap);
      setRoomBeds(bedsMap);
    } catch (err) {
      console.error('Error fetching beds:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingRoom) {
      setEditingRoom(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewRoom(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear submit error when user starts typing
    if (submitError) setSubmitError(null);
  };

  const handleEdit = (room) => {
    setEditingRoom({
      ...room,
      rent: room.rent?.toString() || '',
      adminFee: room.adminFee?.toString() || '',
      securityDeposit: room.securityDeposit?.toString() || '',
      additionalRent: room.additionalRent?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitError(null);
      const roomData = {
        name: (editingRoom ? editingRoom.name : newRoom.name).trim(),
        capacity: parseInt(editingRoom ? editingRoom.capacity : newRoom.capacity, 10),
        rent: parseFloat(editingRoom ? editingRoom.rent : newRoom.rent),
        admin_fee: parseFloat(editingRoom ? editingRoom.adminFee : newRoom.adminFee) || 0,
        security_deposit: parseFloat(editingRoom ? editingRoom.securityDeposit : newRoom.securityDeposit) || 0,
        additional_rent: parseFloat(editingRoom ? editingRoom.additionalRent : newRoom.additionalRent) || 0,
        description: (editingRoom ? editingRoom.description : newRoom.description).trim(),
        boarding_house_id: parseInt(boardingHouseId, 10)
      };

      // Validate data
      if (!roomData.name) throw new Error('Room name is required');
      if (isNaN(roomData.capacity) || roomData.capacity <= 0) throw new Error('Invalid capacity');
      if (isNaN(roomData.rent) || roomData.rent <= 0) throw new Error('Invalid rent amount');

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, roomData);
      } else {
        await api.post('/rooms', roomData);
      }
      
      await fetchRooms();
      setIsModalOpen(false);
      setNewRoom({
        name: '',
        capacity: '',
        rent: '',
        adminFee: '',
        securityDeposit: '',
        additionalRent: '',
        description: ''
      });
      setEditingRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
      setSubmitError(error.message || 'Room management is currently under development. Please try again later.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'Fully Occupied':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'Partially Occupied':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  const getBedStatusColor = (status) => {
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

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading rooms...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Rooms</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Manage your boarding house rooms and occupancy
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="block rounded-md bg-[#E78D69] px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
            disabled={!boardingHouseId}
          >
            <PlusIcon className="inline-block h-4 w-4 mr-1" />
            Add Room
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 flow-root">
        <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-4 lg:-mx-6">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider sm:pl-4">
                    Room Name
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Occupants
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Monthly Rent
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Admin Fee
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Security Deposit
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms && rooms.length > 0 ? (
                  rooms.map((room) => {
                    const beds = roomBeds[room.id] || [];
                    const isExpanded = expandedRooms[room.id];
                    const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
                    const availableBeds = beds.filter(bed => bed.status === 'available').length;
                    
                    console.log(`Room ${room.id} (${room.name}):`, {
                      beds,
                      isExpanded,
                      occupiedBeds,
                      availableBeds,
                      roomBeds: roomBeds[room.id]
                    });
                    
                    return (
                      <React.Fragment key={room.id}>
                        {/* Room Row */}
                        <tr className="hover:bg-gray-50">
                          <td className="py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-4 border-x border-gray-200">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleRoomExpansion(room.id)}
                                className="mr-2 p-1 hover:bg-gray-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                              <div>
                                <div className="font-medium">{room.name}</div>
                                {beds.length > 0 && (
                                  <div className="text-[10px] text-gray-500">
                                    {beds.length} bed{beds.length !== 1 ? 's' : ''} • {occupiedBeds} occupied • {availableBeds} available
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                            {room.capacity}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                            {room.currentOccupants || occupiedBeds}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                            US${(room.rent || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                            US${(room.adminFee || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200">
                            US${(room.securityDeposit || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs border-r border-gray-200">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(room.status || 'Available')}`}>
                              {room.status || 'Available'}
                            </span>
                          </td>
                          <td className="relative py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-4 border-r border-gray-200">
                            <button 
                              onClick={() => handleEdit(room)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                        
                        {/* Beds Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="px-4 py-3 border-x border-gray-200">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                  <HomeIcon className="h-3 w-3 mr-1" />
                                  Beds in {room.name}
                                </div>
                                {beds.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {beds.map((bed) => (
                                      <div key={bed.id} className="bg-white border border-gray-200 rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <HomeIcon className="h-3 w-3 text-gray-400 mr-1" />
                                            <span className="text-xs font-medium text-gray-900">
                                              Bed {bed.bed_number}
                                            </span>
                                          </div>
                                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${getBedStatusColor(bed.status)}`}>
                                            {bed.status}
                                          </span>
                                        </div>
                                        <div className="mt-1 text-[10px] text-gray-500">
                                          <div>Price: US${(bed.price || 0).toLocaleString()}</div>
                                          {bed.student_name && (
                                            <div className="flex items-center mt-1">
                                              <UserIcon className="h-2 w-2 mr-1" />
                                              {bed.student_name}
                                            </div>
                                          )}
                                          {bed.notes && (
                                            <div className="mt-1 text-gray-400">{bed.notes}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-xs text-gray-500">
                                    <HomeIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                                    <p>No beds found for this room</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      Beds may not be configured yet or there was an error loading them
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 py-4 text-sm text-center text-gray-500">
                      No rooms available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Room Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-60" onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-3">
                        {editingRoom ? 'Edit Room' : 'Add New Room'}
                      </Dialog.Title>
                      
                      {/* Submit Error Message */}
                      {submitError && (
                        <div className="mt-2 p-2 text-xs text-red-600 bg-red-50 rounded-md">
                          {submitError}
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                            Room Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={editingRoom ? editingRoom.name : newRoom.name}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="capacity" className="block text-xs font-medium text-gray-700 mb-1">
                            Capacity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="capacity"
                            id="capacity"
                            value={editingRoom ? editingRoom.capacity : newRoom.capacity}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="rent" className="block text-xs font-medium text-gray-700 mb-1">
                            Monthly Rent (US$) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="rent"
                            id="rent"
                            value={editingRoom ? editingRoom.rent : newRoom.rent}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="adminFee" className="block text-xs font-medium text-gray-700 mb-1">
                            Admin Fee (US$)
                          </label>
                          <input
                            type="number"
                            name="adminFee"
                            id="adminFee"
                            value={editingRoom ? editingRoom.adminFee : newRoom.adminFee}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="securityDeposit" className="block text-xs font-medium text-gray-700 mb-1">
                            Security Deposit (US$)
                          </label>
                          <input
                            type="number"
                            name="securityDeposit"
                            id="securityDeposit"
                            value={editingRoom ? editingRoom.securityDeposit : newRoom.securityDeposit}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="additionalRent" className="block text-xs font-medium text-gray-700 mb-1">
                            Additional Rent (US$)
                          </label>
                          <input
                            type="number"
                            name="additionalRent"
                            id="additionalRent"
                            value={editingRoom ? editingRoom.additionalRent : newRoom.additionalRent}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            value={editingRoom ? editingRoom.description : newRoom.description}
                            onChange={handleInputChange}
                            rows={2}
                            className="block w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="mt-5 sm:mt-4 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            onClick={() => {
                              setIsModalOpen(false);
                              setEditingRoom(null);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-md bg-[#E78D69] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E78D69]/90"
                          >
                            {editingRoom ? 'Save Changes' : 'Add Room'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 