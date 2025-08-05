import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../utils/api';
const AddSupplier = () => {
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    boarding_house_id: ''
  });
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoardingHouses = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/boarding-houses`);
        setBoardingHouses(response.data);
      } catch (err) {
        setError('Failed to load boarding houses');
      }
    };
    fetchBoardingHouses();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BASE_URL}/suppliers`, form);
      navigate('/dashboard/suppliers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 flex justify-center items-start">
      <div className="bg-white border border-gray-200 p-8 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Add Supplier</h1>
        {error && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              name="name"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={handleChange}
              placeholder="Supplier name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.contact_person}
              onChange={handleChange}
              placeholder="Contact person"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Boarding House*</label>
            <select
              name="boarding_house_id"
              required
              className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.boarding_house_id}
              onChange={handleChange}
            >
              <option value="">Select boarding house</option>
              {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>{bh.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/suppliers')}
              className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#E78D69' }}
            >
              {loading ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplier; 