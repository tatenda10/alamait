import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Squares2X2Icon,
  EyeIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import RoomCard from '../../components/RoomCard';
import BASE_URL from '../../utils/api';

const RoomBrowser = () => {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [boardingHouses, setBoardingHouses] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    boardingHouse: '',
    roomSize: '',
    priceRange: ''
  });

  // Sample data for demonstration
  const sampleRooms = [
    {
      id: 1,
      name: "Executive Suite",
      boarding_house_name: "Belvedere House",
      location: "Cempaka Timur, Downtown",
      capacity: 1,
      bedInfo: {
        totalBeds: 1,
        availableBeds: 1,
        occupiedBeds: 0,
        minPrice: 200,
        maxPrice: 200
      },
      description: "Luxury single occupancy room with private bathroom",
      amenities: "Private Bathroom, Air Conditioning, Study Desk, Wardrobe",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      type: "Single"
    },
    {
      id: 2,
      name: "Standard Double",
      boarding_house_name: "St. Kilda House",
      location: "Jl. Banaran No.117 Banaran Sekaran, Campus Area",
      capacity: 2,
      bedInfo: {
        totalBeds: 2,
        availableBeds: 1,
        occupiedBeds: 1,
        minPrice: 150,
        maxPrice: 180
      },
      description: "Comfortable double occupancy room with shared facilities",
      amenities: "Shared Bathroom, Fan, Study Desk, Wardrobe",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      type: "Mixed"
    },
    {
      id: 3,
      name: "Economy Quad",
      boarding_house_name: "Belvedere House",
      location: "Jl. Prof Huda No.76 Banyumanik, Campus Area",
      capacity: 4,
      bedInfo: {
        totalBeds: 4,
        availableBeds: 2,
        occupiedBeds: 2,
        minPrice: 120,
        maxPrice: 140
      },
      description: "Budget-friendly four-person room",
      amenities: "Shared Bathroom, Fan, Study Desk, Wardrobe",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      type: "Mixed"
    },
    {
      id: 4,
      name: "Deluxe Triple",
      boarding_house_name: "St. Kilda House",
      location: "Cempaka Timur, Campus Area",
      capacity: 3,
      bedInfo: {
        totalBeds: 3,
        availableBeds: 1,
        occupiedBeds: 2,
        minPrice: 160,
        maxPrice: 190
      },
      description: "Spacious three-person room with modern amenities",
      amenities: "En-suite Bathroom, Air Conditioning, Study Desk, Wardrobe, Mini Fridge",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      type: "Mixed"
    },
    {
      id: 5,
      name: "Premium Single",
      boarding_house_name: "Belvedere House",
      location: "Jl. Banaran No.117 Banaran Sekaran, Downtown",
      capacity: 1,
      bedInfo: {
        totalBeds: 1,
        availableBeds: 0,
        occupiedBeds: 1,
        minPrice: 180,
        maxPrice: 180
      },
      description: "Premium single room with modern facilities",
      amenities: "Private Bathroom, Air Conditioning, Study Desk, Wardrobe, Mini Fridge",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      type: "Single"
    },
    {
      id: 6,
      name: "Budget Double",
      boarding_house_name: "St. Kilda House",
      location: "Jl. Prof Huda No.76 Banyumanik, Campus Area",
      capacity: 2,
      bedInfo: {
        totalBeds: 2,
        availableBeds: 2,
        occupiedBeds: 0,
        minPrice: 130,
        maxPrice: 150
      },
      description: "Affordable double occupancy room",
      amenities: "Shared Bathroom, Fan, Study Desk, Wardrobe",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      type: "Mixed"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch rooms and boarding houses in parallel
        const [roomsResponse, boardingHousesResponse] = await Promise.all([
          fetch(`${BASE_URL}/rooms/all`),
          fetch(`${BASE_URL}/boarding-houses`)
        ]);
        
        const roomsData = await roomsResponse.json();
        const boardingHousesData = await boardingHousesResponse.json();
        
        setRooms(roomsData);
        setFilteredRooms(roomsData);
        setBoardingHouses(boardingHousesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to sample data if API fails
        setRooms(sampleRooms);
        setFilteredRooms(sampleRooms);
        setBoardingHouses([
          { id: 4, name: 'St Kilda' },
          { id: 5, name: 'Belvedere' },
          { id: 6, name: 'Fifth Avenue' },
          { id: 7, name: 'Amin' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = rooms;

            // Filter by boarding house
            if (filters.boardingHouse) {
              filtered = filtered.filter(room => 
                room.boarding_house_id && 
                room.boarding_house_id.toString() === filters.boardingHouse
              );
            }

            // Filter by room size
            if (filters.roomSize) {
              filtered = filtered.filter(room => {
                switch (filters.roomSize) {
                  case 'single':
                    return room.capacity === 1;
                  case 'double':
                    return room.capacity === 2;
                  case 'triple':
                    return room.capacity === 3;
                  case 'quad':
                    return room.capacity === 4;
                  default:
                    return true;
                }
              });
            }

            // Filter by price range
            if (filters.priceRange) {
              filtered = filtered.filter(room => {
                const minPrice = room.bedInfo?.minPrice || room.price_per_bed || 0;
                switch (filters.priceRange) {
                  case 'under-150':
                    return minPrice < 150;
                  case '150-200':
                    return minPrice >= 150 && minPrice <= 200;
                  case 'over-200':
                    return minPrice > 200;
                  default:
                    return true;
                }
              });
            }


    setFilteredRooms(filtered);
  }, [filters, rooms]);

  const toggleFavorite = (roomId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(roomId)) {
      newFavorites.delete(roomId);
    } else {
      newFavorites.add(roomId);
    }
    setFavorites(newFavorites);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Single':
        return 'text-blue-600';
      case 'Mixed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop')`,
          filter: 'brightness(0.6)'
        }}
      ></div>

      {/* Header */}
      <div className="relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">ALAMAIT</h1>
                <p className="text-sm text-white opacity-90">Feels like home</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/apply" className="text-white hover:text-blue-300 font-medium transition-colors">Apply Now</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="bg-gray-100 bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all border border-white border-opacity-20"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center h-64 px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          {/* Filter Controls */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-b-lg shadow-xl p-6 border border-teal-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Boarding House Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Boarding House</label>
                  <select
                    value={filters.boardingHouse}
                    onChange={(e) => handleFilterChange('boardingHouse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                  >
                    <option value="">All Houses</option>
                    {boardingHouses.map(bh => (
                      <option key={bh.id} value={bh.id}>
                        {bh.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Size Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Room Size</label>
                  <select
                    value={filters.roomSize}
                    onChange={(e) => handleFilterChange('roomSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                  >
                    <option value="">All Sizes</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="quad">Quad</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                  >
                    <option value="">All Prices</option>
                    <option value="under-150">Under $150</option>
                    <option value="150-200">$150 - $200</option>
                    <option value="over-200">Over $200</option>
                  </select>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Listings Section */}
      <div className="relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Find the Best Accommodation from Us</h2>
            <p className="text-gray-600">Discover comfortable student housing options</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isFavorite={favorites.has(room.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later for new options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomBrowser;
