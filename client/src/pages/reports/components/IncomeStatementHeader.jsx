import React from 'react';
import { FaDownload } from 'react-icons/fa';

const IncomeStatementHeader = ({
  showExportModal,
  setShowExportModal,
  dateRange,
  useCustomDateRange,
  boardingHouses,
  selectedBoardingHouses,
  setSelectedBoardingHouses,
  isConsolidated,
  setIsConsolidated,
  fetchIncomeStatementData
}) => {
  const formatDateRange = () => {
    if (useCustomDateRange && dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate).toLocaleDateString();
      const endDate = new Date(dateRange.endDate).toLocaleDateString();
      return `${startDate} - ${endDate}`;
    } else {
      const currentYear = new Date().getFullYear();
      return `January 1, ${currentYear} - December 31, ${currentYear}`;
    }
  };

  const handleBoardingHouseChange = (e) => {
    const value = e.target.value;
    if (value === 'consolidated') {
      setIsConsolidated(true);
      setSelectedBoardingHouses([]);
    } else {
      setIsConsolidated(false);
      setSelectedBoardingHouses([parseInt(value)]);
    }
    // Trigger data refresh
    setTimeout(() => fetchIncomeStatementData(), 100);
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedBoardingHouses([]);
    } else {
      setSelectedBoardingHouses([parseInt(value)]);
    }
  };

  const getSelectedBoardingHouseName = () => {
    if (isConsolidated) {
      return 'All Properties';
    } else if (selectedBoardingHouses.length > 0) {
      const selectedHouse = boardingHouses.find(bh => bh.id === selectedBoardingHouses[0]);
      return selectedHouse ? selectedHouse.name : 'All Properties';
    }
    return 'All Properties';
  };

  return (
    <div className="border-b border-gray-300 bg-white">
      <div className="w-full px-8 py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">INCOME STATEMENT</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-xs text-gray-600">
                {formatDateRange()}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Property:</label>
                  <select
                    value={isConsolidated ? 'consolidated' : (selectedBoardingHouses[0] || 'consolidated')}
                    onChange={handleBoardingHouseChange}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="consolidated">All Properties (Consolidated)</option>
                    {boardingHouses.map(bh => (
                      <option key={bh.id} value={bh.id}>
                        {bh.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {isConsolidated && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Filter:</label>
                    <select
                      value={selectedBoardingHouses.length > 0 ? selectedBoardingHouses[0] : 'all'}
                      onChange={handleFilterChange}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">Show All</option>
                      {boardingHouses.map(bh => (
                        <option key={bh.id} value={bh.id}>
                          {bh.name} Only
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-gray-600 text-white px-4 py-2 text-sm font-medium border border-gray-600 hover:bg-gray-700 flex items-center gap-2"
            >
              <FaDownload />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementHeader;