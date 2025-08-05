import React from 'react';
import { FaSpinner, FaDownload, FaFilePdf, FaFileExcel } from 'react-icons/fa';

const ExportModal = ({
  showExportModal,
  setShowExportModal,
  exportLoading,
  setExportLoading,
  exportType,
  setExportType,
  calculations,
  formatCurrency,
  dateRange,
  useCustomDateRange,
  isConsolidated,
  selectedBoardingHouses,
  boardingHouses
}) => {
  if (!showExportModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 max-w-sm w-full mx-4 border border-gray-200">
        <div className="text-center">
          <div className="mb-3">
            {exportLoading ? (
              <FaSpinner className="animate-spin text-2xl text-gray-600 mx-auto mb-2" />
            ) : (
              <FaDownload className="text-2xl text-gray-600 mx-auto mb-2" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {exportLoading ? 'Exporting Report...' : 'Export Financial Report'}
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            {exportLoading 
              ? 'Please wait while we generate your report.' 
              : 'Choose the format you want to export the report.'
            }
          </p>
          
          {!exportLoading && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setExportType('pdf');
                  confirmExport();
                }}
                className="bg-gray-600 text-white px-3 py-1 text-xs transition-colors flex items-center gap-1"
              >
                <FaFilePdf />
                PDF
              </button>
              <button
                onClick={() => {
                  setExportType('excel');
                  confirmExport();
                }}
                className="bg-gray-600 text-white px-3 py-1 text-xs transition-colors flex items-center gap-1"
              >
                <FaFileExcel />
                Excel
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-gray-400 text-white px-3 py-1 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;