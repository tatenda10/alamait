import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  HeartIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import RoomCard from '../components/RoomCard';

const StudentPortalLanding = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set([2])); // Pre-favorite the Deluxe Triple
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rooms?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/rooms');
    }
  };

  const toggleFavorite = (roomId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(roomId)) {
      newFavorites.delete(roomId);
    } else {
      newFavorites.add(roomId);
    }
    setFavorites(newFavorites);
  };

  const featuredRooms = [
    {
      id: 1,
      name: "Executive Suite",
      boarding_house_name: "Belvedere House",
      location: "Belvedere House, Downtown",
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
      name: "Deluxe Triple",
      boarding_house_name: "St. Kilda House",
      location: "St. Kilda House, Campus Area",
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
      id: 3,
      name: "Budget Double",
      boarding_house_name: "St. Kilda House",
      location: "St. Kilda House, Campus Area",
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

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&h=1080&fit=crop')`,
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
                <p className="text-sm text-white opacity-90">FEELS LIKE HOME</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-white hover:text-blue-300 font-medium transition-colors">Home</Link>
              <Link to="/rooms" className="text-white hover:text-blue-300 font-medium transition-colors">Favorites</Link>
              <Link to="/rooms" className="text-white hover:text-blue-300 font-medium transition-colors">Chat</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-100 bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all border border-white border-opacity-20">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          {/* Room Finder Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 drop-shadow-lg">
            Room Finder
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-teal-200">
                <div className="flex items-center px-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for area / boarding house address"
                  className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent rounded-l-lg"
                />
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 transition-colors duration-200 font-medium rounded-r-lg"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortalLanding;
