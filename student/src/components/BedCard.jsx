import React from 'react';
import { 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const BedCard = ({ bed, isSelected, onSelect }) => {
  const isAvailable = bed.status === 'available';

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        isAvailable
          ? isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300'
          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
      }`}
      onClick={() => isAvailable && onSelect(bed)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">Bed {bed.bedNumber}</div>
          <div className="text-lg font-bold text-blue-600">${bed.price}/month</div>
        </div>
        <div className="flex items-center">
          {isAvailable ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : (
            <XMarkIcon className="h-6 w-6 text-red-500" />
          )}
        </div>
      </div>
      <div className="mt-2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          isAvailable
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {isAvailable ? 'Available' : 'Occupied'}
        </span>
      </div>
    </div>
  );
};

export default BedCard;
