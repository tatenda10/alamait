import React from 'react';
import { FaSearch } from 'react-icons/fa';

const ControlsPanel = ({
  useCustomDateRange,
  setUseCustomDateRange,
  dateRange,
  setDateRange,
  onSearch
}) => {
  return (
    <div className="border-b border-gray-300 bg-white">
      <div className="w-full px-8 py-3">
        <div className="flex items-center gap-4">
          
          {/* Date Range Section */}
          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useCustomDateRange}
                onChange={(e) => setUseCustomDateRange(e.target.checked)}
                className="mr-2"
              />
              <span className="text-xs font-medium text-gray-900">Use Custom Date Range</span>
            </label>

            {useCustomDateRange && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-700">From:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-700">To:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-gray-500"
                  />
                </div>
                <button
                  onClick={onSearch}
                  className="bg-blue-600 text-white px-3 py-1 text-xs font-medium border border-blue-600 hover:bg-blue-700 flex items-center gap-1"
                >
                  <FaSearch className="text-xs" />
                  Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;