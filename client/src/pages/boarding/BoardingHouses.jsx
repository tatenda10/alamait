import React, { useState, useEffect } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiFilter, FiDownload, FiX, FiMapPin, FiUser, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

// EditBoardingHouseModal Component
const EditBoardingHouseModal = ({ isOpen, onClose, onBoardingHouseUpdated, token, allAdmins, boardingHouse }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    admin_user_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardingHouse) {
      setFormData({
        name: boardingHouse.name,
        location: boardingHouse.location,
        admin_user_id: boardingHouse.admin_ids ? boardingHouse.admin_ids.split(',')[0] : ''
      });
    }
  }, [boardingHouse]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.put(`${BASE_URL}/boarding-houses/${boardingHouse.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      onBoardingHouseUpdated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update boarding house');
      console.error('Update error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Boarding House</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              name="name"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter boarding house name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location*</label>
            <input
              type="text"
              name="location"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Admin User*</label>
            <select
              name="admin_user_id"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.admin_user_id}
              onChange={handleChange}
            >
              <option value="">Select an admin</option>
              {allAdmins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.username} ({admin.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              {loading ? 'Updating...' : 'Update Boarding House'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AddBoardingHouseModal Component
const AddBoardingHouseModal = ({ isOpen, onClose, onBoardingHouseAdded, token, availableAdmins }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    admin_user_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/boarding-houses`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      onBoardingHouseAdded(response.data);
      onClose();
      setFormData({
        name: '',
        location: '',
        admin_user_id: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create boarding house');
      console.error('Creation error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add New Boarding House</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              name="name"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter boarding house name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location*</label>
            <input
              type="text"
              name="location"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Admin User*</label>
            <select
              name="admin_user_id"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.admin_user_id}
              onChange={handleChange}
            >
              <option value="">Select an admin</option>
              {availableAdmins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.username} ({admin.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              {loading ? 'Creating...' : 'Create Boarding House'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main BoardingHouses Component
export default function BoardingHouses() {
  const { token } = useAuth();
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateAccountsLoading, setUpdateAccountsLoading] = useState(false);
  const [updateAccountsMessage, setUpdateAccountsMessage] = useState('');

  const ITEMS_PER_PAGE = 10;

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Boarding Houses Response:', response.data);
      setBoardingHouses(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching boarding houses:', err.response || err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to fetch boarding houses');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAdmins = async () => {
    try {
      // Fetch all admin users
      const response = await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(response)
      // Set both availableAdmins and allAdmins to the same data
      // since we now get all admins regardless of assignment status
      setAvailableAdmins(response.data);
      setAllAdmins(response.data);
      
      console.log('All Admin Users:', response.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  const handleBoardingHouseAdded = (newBoardingHouse) => {
    setBoardingHouses(prev => [...prev, newBoardingHouse]);
    fetchAvailableAdmins(); // Refresh available admins list
  };

  useEffect(() => {
    if (token) {
      console.log('Fetching with token:', token);
      fetchBoardingHouses();
      fetchAvailableAdmins();
    }
  }, [token]);

  const handleEditClick = (house) => {
    console.log('Selected Boarding House:', house);
    setSelectedBoardingHouse(house);
    setIsEditModalOpen(true);
  };

  const handleBoardingHouseUpdated = (updatedHouse) => {
    console.log('Updated Boarding House:', updatedHouse);
    setBoardingHouses(prev => 
      prev.map(house => house.id === updatedHouse.id ? updatedHouse : house)
    );
    fetchAvailableAdmins(); // Refresh available admins list
  };

  const updateChartOfAccounts = async () => {
    setUpdateAccountsLoading(true);
    setUpdateAccountsMessage('');
    setError('');
    
    try {
      const response = await axios.post(
        `${BASE_URL}/boarding-houses/update-chart-of-accounts`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setUpdateAccountsMessage(response.data.message || 'Chart of accounts updated successfully!');
      console.log('Chart of accounts update response:', response.data);
    } catch (err) {
      console.error('Error updating chart of accounts:', err);
      setError(err.response?.data?.message || 'Failed to update chart of accounts');
    } finally {
      setUpdateAccountsLoading(false);
    }
  };

  const getAdminName = (house) => {
    if (!house.admin_names) return 'No admin assigned';
    
    // If we have admin_ids, try to get more detailed info from allAdmins
    if (house.admin_ids && allAdmins.length > 0) {
      const adminId = house.admin_ids.split(',')[0];
      const admin = allAdmins.find(a => a.id.toString() === adminId);
      if (admin) {
        return `${admin.username} (${admin.email})`;
      }
    }
    
    // Fallback to just the name
    return house.admin_names.split(',')[0];
  };

  const filteredBoardingHouses = boardingHouses.filter(house =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBoardingHouses.length / ITEMS_PER_PAGE);
  const paginatedBoardingHouses = filteredBoardingHouses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    console.log('Current Boarding Houses:', boardingHouses);
    console.log('Filtered Boarding Houses:', filteredBoardingHouses);
    console.log('Paginated Boarding Houses:', paginatedBoardingHouses);
  }, [boardingHouses, filteredBoardingHouses, paginatedBoardingHouses]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (updateAccountsMessage) {
      const timer = setTimeout(() => {
        setUpdateAccountsMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateAccountsMessage]);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Boarding Houses</h1>
        <p className="text-xs text-gray-500">Manage boarding houses and their administrators</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {updateAccountsMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm">
          {updateAccountsMessage}
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search boarding houses..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={updateChartOfAccounts}
              disabled={updateAccountsLoading}
              className="flex items-center gap-2 px-3 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: updateAccountsLoading ? '#9CA3AF' : '#10B981' }}
              title="Update chart of accounts for all boarding houses"
            >
              <FiRefreshCw size={14} className={updateAccountsLoading ? 'animate-spin' : ''} />
              <span>{updateAccountsLoading ? 'Updating...' : 'Update Accounts'}</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiDownload size={14} />
              <span>Export</span>
            </button>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              + Add Boarding House
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-left">Admin</th>
                <th className="px-6 py-3 text-left">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading boarding houses...
                  </td>
                </tr>
              ) : paginatedBoardingHouses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No boarding houses found
                  </td>
                </tr>
              ) : (
                paginatedBoardingHouses.map((house) => (
                  <tr key={house.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{house.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 text-gray-400" size={14} />
                        {house.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-gray-400" size={14} />
                        <span className="text-xs">{getAdminName(house)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(house.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit boarding house"
                        onClick={() => handleEditClick(house)}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete boarding house"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBoardingHouses.length)} of {filteredBoardingHouses.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Boarding House Modal */}
      <AddBoardingHouseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBoardingHouseAdded={handleBoardingHouseAdded}
        token={token}
        availableAdmins={availableAdmins}
      />

      {/* Edit Boarding House Modal */}
      <EditBoardingHouseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBoardingHouse(null);
        }}
        onBoardingHouseUpdated={handleBoardingHouseUpdated}
        token={token}
        allAdmins={allAdmins}
        boardingHouse={selectedBoardingHouse}
      />
    </div>
  );
}