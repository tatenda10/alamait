import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const SaveModal = ({
  showSaveModal,
  setShowSaveModal,
  saveStatementName,
  setSaveStatementName,
  savingStatement,
  saveIncomeStatement,
  dateRange,
  useCustomDateRange,
  isConsolidated,
  selectedBoardingHouses,
  boardingHouses
}) => {  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-md w-full mx-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Income Statement</h3>
          <p className="text-sm text-gray-600">
            Save this income statement configuration for future reference.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Statement Name</label>
          <input
            type="text"
            value={saveStatementName}
            onChange={(e) => setSaveStatementName(e.target.value)}
            placeholder="Enter a name for this statement..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statement Details:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Date Range:</strong> {useCustomDateRange ? `${dateRange.startDate} to ${dateRange.endDate}` : 'Current Year'}</p>
            <p><strong>Scope:</strong> {isConsolidated ? 'All Boarding Houses' : 'Selected Houses'}</p>

          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              setShowSaveModal(false);
              setSaveStatementName('');
            }}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveIncomeStatement}
            disabled={savingStatement || !saveStatementName.trim()}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingStatement && <FaSpinner className="animate-spin" />}
            {savingStatement ? 'Saving...' : 'Save Statement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;