import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Squares2X2Icon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../../utils/api';

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [roomImages, setRoomImages] = useState([]);


  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        
        // Fetch room details
        const roomResponse = await fetch(`${BASE_URL}/rooms/${id}`);
        const roomData = await roomResponse.json();
        
        // Handle the API response structure
        if (roomData.success && roomData.data) {
          setRoom(roomData.data);
        } else {
          setRoom(roomData); // Fallback if structure is different
        }
        
        // Fetch beds for this room
        const bedsResponse = await fetch(`${BASE_URL}/beds/room/${id}/public`);
        const bedsData = await bedsResponse.json();
        setBeds(Array.isArray(bedsData) ? bedsData : []);
        
        // Fetch room images
        const imagesResponse = await fetch(`${BASE_URL}/rooms/${id}/images`);
        const imagesData = await imagesResponse.json();
        setRoomImages(Array.isArray(imagesData) ? imagesData : []);
        
      } catch (error) {
        console.error('Failed to fetch room data:', error);
        // Set empty data if API fails
        setRoom(null);
        setBeds([]);
        setRoomImages([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoomData();
    }
  }, [id]);

  const handleBedSelection = (bed) => {
    if (bed.status === 'available') {
      setSelectedBed(bed);
    }
  };

  const nextImage = () => {
    if (roomImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === roomImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (roomImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? roomImages.length - 1 : prev - 1
      );
    }
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleApply = () => {
    if (selectedBed) {
      // Navigate to application form with bed selection
      navigate(`/apply?roomId=${room.id}&bedId=${selectedBed.id}&bedNumber=${selectedBed.bedNumber}&price=${selectedBed.price}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Room not found</h3>
          <p className="text-gray-600 mb-4">The room you're looking for doesn't exist.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Rooms
          </Link>
        </div>
      </div>
    );
  }

  const availableBeds = Array.isArray(beds) ? beds.filter(bed => bed.status === 'available') : [];
  const occupiedBeds = Array.isArray(beds) ? beds.filter(bed => bed.status === 'occupied') : [];

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
                <p className="text-sm text-white opacity-90">Feels like home</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-white hover:text-blue-300 font-medium transition-colors">Browse Rooms</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-100 bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all border border-white border-opacity-20">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center h-96 px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          {/* Room Name Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 drop-shadow-lg">
            {room?.name}
          </h1>
          
          {/* Room Location */}
          <p className="text-xl text-white opacity-90 mb-8">
            {room?.boarding_house_name}
          </p>
        </div>
      </div>

      {/* Room Details Section */}
      <div className="relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Room Gallery</h2>
              
              {/* Main Image */}
              <div className="relative">
                {roomImages.length > 0 ? (
                  <img
                    src={`${BASE_URL}/rooms/${id}/images/${roomImages[currentImageIndex]?.id}`}
                    alt={`${room?.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                    <PhotoIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Navigation Arrows */}
                {roomImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {roomImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {roomImages.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {roomImages.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {roomImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => selectImage(index)}
                      className={`relative overflow-hidden rounded-lg ${
                        index === currentImageIndex ? 'ring-2 ring-teal-500' : ''
                      }`}
                    >
                      <img
                        src={`${BASE_URL}/rooms/${id}/images/${image.id}`}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-16 sm:h-20 object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room Information */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Room Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm sm:text-base text-gray-600">{room?.description}</p>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room?.amenities && room.amenities.split(', ').map((amenity, index) => (
                      <span key={index} className="bg-teal-100 text-teal-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {!room?.amenities && (
                      <span className="text-gray-500 text-sm">No amenities listed</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center text-gray-600 mb-2">
                      <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base font-medium">Capacity</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{room?.capacity} person{room?.capacity > 1 ? 's' : ''}</div>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base font-medium">Available Beds</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{availableBeds.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bed Selection Section */}
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Select Your Bed</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.isArray(beds) && beds.map((bed) => (
                <div
                  key={bed.id}
                  className={`rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                    bed.status === 'available'
                      ? selectedBed?.id === bed.id
                        ? 'border-teal-500 bg-teal-50 shadow-lg'
                        : 'border-gray-200 hover:border-teal-300 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => handleBedSelection(bed)}
                >
                  {/* Bed Image */}
                  <div className="relative h-32 w-full">
                    {bed.bed_image ? (
                      <img
                        src={`${BASE_URL}/beds/${bed.id}/image`}
                        alt={`Bed ${bed.bedNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {bed.status === 'available' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 bg-white rounded-full" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-red-500 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  {/* Bed Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">Bed {bed.bedNumber}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        bed.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bed.status === 'available' ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-teal-600">${bed.price}/month</div>
                    {bed.notes && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{bed.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedBed && (
              <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-medium text-teal-900 mb-2">Selected Bed</h3>
                <div className="text-sm text-teal-800">
                  <div>Bed {selectedBed.bedNumber}</div>
                  <div className="font-bold">${selectedBed.price}/month</div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleApply}
                disabled={!selectedBed}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedBed
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedBed ? 'Apply for This Bed' : 'Select a Bed to Apply'}
              </button>
            </div>

            {availableBeds.length === 0 && (
              <div className="text-center py-8">
                <XMarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No beds available</p>
                <p className="text-gray-600">This room is currently fully occupied.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
