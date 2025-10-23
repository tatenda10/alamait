import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../utils/api';
import BedManagement from '../components/BedManagement';
import RoomImageManagement from '../components/RoomImageManagement';
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
  Squares2X2Icon,
  PhotoIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ViewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  console.log('ViewRoom component loaded with ID:', id);

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    fetchRoom();
    fetchBeds();
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching room with ID:', id);
      const response = await api.get(`/rooms/${id}`);
      console.log('Room API response:', response.data);
      
      if (response.data.success) {
        console.log('🔍 Frontend received room data:', response.data.data);
        setRoom(response.data.data);
      } else {
        console.log('🔍 Frontend received room data (no success flag):', response.data);
        setRoom(response.data);
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await api.get(`/beds/room/${id}`);
      setBeds(response.data || []);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setBeds([]);
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
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'occupied':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'maintenance':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  if (loading) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading room details...</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-500">{error || 'Room not found'}</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', name: 'Room Details', icon: HomeIcon },
    { id: 'beds', name: 'Bed Management', icon: Squares2X2Icon },
    { id: 'images', name: 'Room Images', icon: PhotoIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Room Information</h3>
            </div>
            <div className="px-6 py-4">
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
                  <dd className="mt-1 text-sm text-gray-900">
                    {beds.length > 0 ? `${beds.length} bed${beds.length !== 1 ? 's' : ''}` : `${room.capacity} person(s)`}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Monthly Rent
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">${room.rent || 0}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Admin Fee
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">${room.admin_fee || 0}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Security Deposit
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">${room.security_deposit || 0}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Additional Rent
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">${room.additional_rent || 0}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(room.status || 'available')}`}>
                      {getStatusIcon(room.status || 'available')}
                      <span className="ml-1">{room.status || 'Available'}</span>
                    </span>
                  </dd>
                </div>

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
            onBedUpdate={() => {
              fetchRoom();
              fetchBeds();
            }}
          />
        );

      case 'images':
        return (
          <RoomImageManagement 
            roomId={room.id} 
            roomName={room.room_name || room.name}
            onImageUpdate={fetchRoom}
          />
        );


      default:
        return null;
    }
  };

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/rooms')}
            className="mr-3 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.room_name || room.name}</h1>
            <p className="text-sm text-gray-500">{room.boarding_house_name}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium ring-1 ring-inset ${getStatusColor(room.status || 'available')}`}>
            {getStatusIcon(room.status || 'available')}
            <span className="ml-2">{room.status || 'Available'}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#E78D69] text-[#E78D69]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
