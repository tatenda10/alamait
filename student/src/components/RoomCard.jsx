import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  Squares2X2Icon,
  EyeIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const RoomCard = ({ room, isFavorite = false, onToggleFavorite }) => {
  const availableBeds = room.bedInfo?.availableBeds || 0;
  const totalBeds = room.bedInfo?.totalBeds || room.capacity || 0;
  const minPrice = room.bedInfo?.minPrice || room.price_per_bed || 0;
  const maxPrice = room.bedInfo?.maxPrice || room.price_per_bed || 0;

  const formatPrice = () => {
    if (minPrice === 0 && maxPrice === 0) {
      return 'Contact for pricing';
    }
    if (minPrice === maxPrice) {
      return `$${minPrice}`;
    }
    return `$${minPrice}-${maxPrice}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      <div className="relative">
        <img
          src={room.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'}
          alt={room.name}
          className="w-full h-48 object-cover"
        />
        {onToggleFavorite && (
          <button 
            onClick={() => onToggleFavorite(room.id)}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 hover:scale-110 transition-all duration-200"
          >
            <HeartIcon className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
          </button>
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            availableBeds > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {availableBeds > 0 ? `${availableBeds} Available` : 'Fully Occupied'}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">{room.location || room.boarding_house_name}</span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-start">
            <div className="flex items-center text-blue-600 font-semibold">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{formatPrice()}/month</span>
            </div>
          </div>
          <div className="flex items-center text-gray-500">
            <Squares2X2Icon className="h-4 w-4 mr-2" />
            <span className="text-sm">Capacity: {totalBeds} bed{totalBeds !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <Link
          to={`/rooms/${room.id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center block transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RoomCard;
