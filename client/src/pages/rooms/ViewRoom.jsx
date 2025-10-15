import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import BedManagement from '../../components/BedManagement';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

export default function ViewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Handle new API response structure
      if (response.data.success) {
        setRoom(response.data.data);
      } else {
        setRoom(response.data); // Fallback for old response format
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to load room details');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'occupied':
        return <UserIcon className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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

  if (!room) {
    return (
      <div className="p-6">
        <div className="text-center">
          <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Room not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The room you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', name: 'Room Details', icon: HomeIcon },
    { id: 'beds', name: 'Bed Management', icon: Squares2X2Icon },
    { id: 'actions', name: 'Quick Actions', icon: Cog6ToothIcon },
    { id: 'statistics', name: 'Statistics', icon: ChartBarIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Room Information
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Room Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{room.room_name || room.name}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    Boarding House
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{room.boarding_house_name || 'Unknown Boarding House'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Capacity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{room.capacity} person(s)</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Monthly Rent
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {room.currency || 'US$'} {parseFloat(room.monthly_rent || room.price_per_bed || 0).toFixed(2)}
                  </dd>
                </div>

                {room.bedInfo && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Squares2X2Icon className="h-4 w-4 mr-2" />
                        Total Beds
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{room.bedInfo.totalBeds}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Available Beds
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{room.bedInfo.availableBeds}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Occupied Beds
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{room.bedInfo.occupiedBeds}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        Price Range
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {room.bedInfo.minPrice === room.bedInfo.maxPrice 
                          ? `${room.currency || 'US$'} ${room.bedInfo.minPrice.toFixed(2)}`
                          : `${room.currency || 'US$'} ${room.bedInfo.minPrice.toFixed(2)} - ${room.bedInfo.maxPrice.toFixed(2)}`
                        }
                      </dd>
                    </div>
                  </>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    {getStatusIcon(room.status)}
                    <span className="ml-2">Status</span>
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </dd>
                </div>

                {room.current_student && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Current Occupant
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{room.current_student}</dd>
                  </div>
                )}

                {room.created_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(room.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>

              {room.description && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{room.description}</dd>
                </div>
              )}

              {room.amenities && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Amenities</dt>
                  <dd className="mt-1 text-sm text-gray-900">{room.amenities}</dd>
                </div>
              )}
            </div>
          </div>
        );

      case 'beds':
        return (
          <BedManagement 
            roomId={room.id} 
            roomName={room.room_name || room.name}
            onBedUpdate={fetchRoom}
          />
        );

      case 'actions':
        return (
          <div className="bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate(`/dashboard/rooms/${room.id}/edit`)}
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020]"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Room Details
                </button>

                {room.status === 'available' && (
                  <button
                    onClick={() => navigate(`/dashboard/students/add?room_id=${room.id}`)}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Assign Student
                  </button>
                )}

                {room.current_student && (
                  <button
                    onClick={() => navigate(`/dashboard/students/${room.current_student_id}`)}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    View Student
                  </button>
                )}

                <button
                  onClick={() => navigate('/dashboard/rooms')}
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020]"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Back to Rooms
                </button>
              </div>
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Room Statistics
              </h3>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Occupancy Rate</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {room.status === 'occupied' ? '100%' : '0%'}
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Monthly Revenue</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {room.status === 'occupied' 
                      ? `${room.currency || 'US$'} ${parseFloat(room.monthly_rent || room.price_per_bed || 0).toFixed(2)}`
                      : `${room.currency || 'US$'} 0.00`
                    }
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Available Spots</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {room.status === 'occupied' ? 0 : room.capacity}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{room.room_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Room details and information
            </p>
          </div>
          <button
            onClick={() => navigate(`/dashboard/rooms/${room.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f58020]"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-[#f58020] text-[#f58020]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  );
}