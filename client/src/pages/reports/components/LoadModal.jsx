import React from 'react';
import { FaSpinner, FaHistory, FaEye, FaTrash } from 'react-icons/fa';

const LoadModal = ({
  showLoadModal,
  setShowLoadModal,
  loadingStatements,
  savedStatements,
  loadSavedStatement,
  deleteSavedStatement
}) => {
  if (!showLoadModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-2xl w-full mx-4 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Load Saved Income Statement</h3>
          <p className="text-sm text-gray-600">
            Select a previously saved income statement to load.
          </p>
        </div>
        
        {loadingStatements ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading saved statements...</p>
          </div>
        ) : savedStatements.length === 0 ? (
          <div className="text-center py-8">
            <FaHistory className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No saved statements found.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {savedStatements.map(statement => (
              <div key={statement.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{statement.name}</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Date Range:</strong> {statement.dateRange.startDate} to {statement.dateRange.endDate}</p>
                      <p><strong>Scope:</strong> {statement.isConsolidated ? 'All Boarding Houses' : 'Selected Houses'}</p>
                      <p><strong>Created:</strong> {new Date(statement.createdAt).toLocaleDateString()} by {statement.createdBy}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => loadSavedStatement(statement.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <FaEye />
                      Load
                    </button>
                    <button
                      onClick={() => deleteSavedStatement(statement.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowLoadModal(false)}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadModal;