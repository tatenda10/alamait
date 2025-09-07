/**
 * Suppliers.jsx - Main suppliers management page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import AddSupplierModal from './AddSupplierModal';
import EditSupplierModal from './EditSupplierModal';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Suppliers fetched successfully:', response.data);
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers based on search term and status
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = (supplier.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.phone || '').includes(searchTerm) ||
                         (supplier.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setShowAddModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleViewSupplier = (supplier) => {
    navigate(`/dashboard/suppliers/${supplier.id}`);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${BASE_URL}/suppliers/${supplierId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Supplier deleted successfully');
        fetchSuppliers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58020]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Suppliers</h1>
        <p className="text-xs text-gray-500">Manage your suppliers and vendor information</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers by company, contact person, phone, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 h-4 w-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button 
              onClick={handleAddSupplier}
              className="flex items-center px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              + Add Supplier
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
                <th className="px-6 py-3 text-left">Company Name</th>
                <th className="px-6 py-3 text-left">Contact Person</th>
                <th className="px-6 py-3 text-left">Contact Number</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-xs text-gray-500">
                    {searchTerm || filterStatus !== 'all' ? 'No suppliers found matching your criteria' : 'No suppliers added yet'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{supplier.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{supplier.contact_person}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{supplier.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 max-w-xs truncate">{supplier.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleViewSupplier(supplier)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="text-gray-600 hover:text-yellow-600 transition-colors"
                        title="Edit Supplier"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete Supplier"
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs font-medium text-gray-500">Total Suppliers</div>
          <div className="text-xl font-bold text-gray-900">{suppliers.length}</div>
        </div>
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs font-medium text-gray-500">Active Suppliers</div>
          <div className="text-xl font-bold text-green-600">
            {suppliers.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-white p-4 border border-gray-200">
          <div className="text-xs font-medium text-gray-500">Categories</div>
          <div className="text-xl font-bold text-blue-600">
            {new Set(suppliers.map(s => s.category).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSupplierModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={fetchSuppliers} 
        />
      )}
      {showEditModal && (
        <EditSupplierModal 
          supplier={selectedSupplier} 
          onClose={() => setShowEditModal(false)} 
          onSuccess={fetchSuppliers} 
        />
      )}
    </div>
  );
};

export default Suppliers;