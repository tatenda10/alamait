/**
 * AddSupplierModal.jsx - Modal for adding new suppliers
 */
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const AddSupplierModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company: '',
    address: '',
    contact_person: '',
    category: '',
    phone: '',
    status: 'active',
    boarding_house_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [boardingHouses, setBoardingHouses] = useState([]);

  const categories = [
    'Office Supplies',
    'Maintenance & Repairs',
    'Food & Beverages',
    'Utilities',
    'Technology',
    'Cleaning Supplies',
    'Construction Materials',
    'Professional Services',
    'Transportation',
    'Other'
  ];

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🏠 Fetching boarding houses...');
      
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🏠 Boarding houses fetched:', response.data);
      setBoardingHouses(response.data);
      
      // Auto-select from localStorage if available
      const storedBoardingHouseId = localStorage.getItem('boarding_house_id');
      console.log('🏠 Stored boarding house ID from localStorage:', storedBoardingHouseId);
      
      if (storedBoardingHouseId) {
        setFormData(prev => ({
          ...prev,
          boarding_house_id: storedBoardingHouseId
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching boarding houses:', error);
    }
  };

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Contact number is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.boarding_house_id) {
      newErrors.boarding_house_id = 'Boarding house is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📝 Form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const boarding_house_id = localStorage.getItem('boarding_house_id');
      
      console.log('🔑 Token from localStorage:', token ? 'Present' : 'Missing');
      console.log('🏠 Boarding house ID from localStorage:', boarding_house_id);
      console.log('🏠 Boarding house ID from form:', formData.boarding_house_id);
      
      const supplierData = {
        ...formData,
        boarding_house_id: formData.boarding_house_id || boarding_house_id || '1'
      };
      
      console.log('📤 Final supplier data being sent:', supplierData);
      
      const response = await axios.post(`${BASE_URL}/suppliers`, supplierData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('✅ Success response:', response.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.log('❌ Error:', error);
      if (error.response) {
        console.log('❌ Error response:', error.response.data);
        setErrors({ submit: error.response.data.message || 'Failed to add supplier' });
      } else {
        setErrors({ submit: 'Network error. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Supplier</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 transition"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="space-y-6">
            {/* Row 1: Company Name and Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                   type="text"
                   name="company"
                   value={formData.company}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                     errors.company ? 'border-red-500' : 'border-gray-300'
                   }`}
                   placeholder="Enter company name"
                 />
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                   type="text"
                   name="contact_person"
                   value={formData.contact_person}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                     errors.contact_person ? 'border-red-500' : 'border-gray-300'
                   }`}
                   placeholder="Enter contact person name"
                 />
                 {errors.contact_person && <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>}
               </div>
             </div>

             {/* Row 2: Phone and Category */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Contact Number *
                 </label>
                 <input
                   type="tel"
                   name="phone"
                   value={formData.phone}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                     errors.phone ? 'border-red-500' : 'border-gray-300'
                   }`}
                   placeholder="Enter contact number"
                 />
                 {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Category *
                 </label>
                 <select
                   name="category"
                   value={formData.category}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                     errors.category ? 'border-red-500' : 'border-gray-300'
                   }`}
                 >
                   <option value="">Select category</option>
                   {categories.map(category => (
                     <option key={category} value={category}>{category}</option>
                   ))}
                 </select>
                 {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
               </div>
             </div>

             {/* Row 3: Boarding House and Status */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Boarding House *
                 </label>
                 <select
                   name="boarding_house_id"
                   value={formData.boarding_house_id}
                   onChange={handleInputChange}
                   className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                     errors.boarding_house_id ? 'border-red-500' : 'border-gray-300'
                   }`}
                 >
                   <option value="">Select boarding house</option>
                   {boardingHouses.map(house => (
                     <option key={house.id} value={house.id}>{house.name}</option>
                   ))}
                 </select>
                 {errors.boarding_house_id && <p className="mt-1 text-sm text-red-600">{errors.boarding_house_id}</p>}
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Status
                 </label>
                 <select
                   name="status"
                   value={formData.status}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
                 >
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                 </select>
               </div>
             </div>

             {/* Row 4: Address (full width) */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Address *
               </label>
               <textarea
                 name="address"
                 value={formData.address}
                 onChange={handleInputChange}
                 rows="3"
                 className={`w-full px-3 py-2 border focus:ring-2 focus:ring-[#f58020] focus:border-transparent ${
                   errors.address ? 'border-red-500' : 'border-gray-300'
                 }`}
                 placeholder="Enter complete address"
               />
               {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
             </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#f58020] text-white hover:bg-[#d67c5a] transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;