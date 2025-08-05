/**
 * ViewSupplierModal.jsx - Modal for viewing supplier details
 */
import React from 'react';
import { FaTimes, FaEdit, FaPhone, FaMapMarkerAlt, FaBuilding, FaUser, FaCalendarAlt } from 'react-icons/fa';

const ViewSupplierModal = ({ supplier, onClose, onEdit }) => {
  if (!supplier) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{supplier.company}</h2>
            <p className="text-gray-600">Supplier Details</p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(supplier)}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition"
                title="Edit Supplier"
              >
                <FaEdit className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              supplier.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {supplier.status?.charAt(0).toUpperCase() + supplier.status?.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUser className="h-5 w-5 text-[#E78D69]" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaUser className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="text-gray-900">{supplier.contact_person || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{supplier.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <div className="text-gray-900">
                      {supplier.address ? (
                        <p>{supplier.address}</p>
                      ) : (
                        <p>Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBuilding className="h-5 w-5 text-[#E78D69]" />
                Business Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaBuilding className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="text-gray-900">{supplier.company || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaBuilding className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {supplier.category || 'Not categorized'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{supplier.total_orders || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${supplier.total_spent ? parseFloat(supplier.total_spent).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt className="h-4 w-4" />
                  Created: {formatDate(supplier.created_at)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt className="h-4 w-4" />
                  Last Updated: {formatDate(supplier.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(supplier)}
              className="px-4 py-2 bg-[#E78D69] text-white rounded-lg hover:bg-[#d67c5a] transition flex items-center gap-2"
            >
              <FaEdit className="h-4 w-4" />
              Edit Supplier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSupplierModal;