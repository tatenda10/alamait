import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../utils/api';
const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
        const response = await axios.get(`${BASE_URL}/suppliers`);
      setSuppliers(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Suppliers</h1>
          <p className="text-xs text-gray-500">Manage all suppliers</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/suppliers/add')}
          className="flex items-center px-4 py-2 text-xs text-white transition-colors"
          style={{ backgroundColor: '#E78D69' }}
        >
          <FiPlus size={14} className="mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Contact Person</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Boarding House</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{supplier.name}</td>
                    <td className="px-6 py-4">{supplier.contact_person || '-'}</td>
                    <td className="px-6 py-4">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4">{supplier.email || '-'}</td>
                    <td className="px-6 py-4">{supplier.boarding_house_id || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit supplier"
                        onClick={() => navigate(`/dashboard/suppliers/${supplier.id}/edit`)}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete supplier"
                        // onClick={() => handleDelete(supplier.id)}
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
      </div>
    </div>
  );
};

export default Suppliers; 