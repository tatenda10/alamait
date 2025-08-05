import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const Payments = () => {
  const { token } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all payments
  const fetchPayments = async () => {
    try {
      console.log('Fetching payments with boarding house:', selectedBoardingHouse);
      const params = {};
      if (selectedBoardingHouse) {
        params.boarding_house_id = selectedBoardingHouse;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get(`${BASE_URL}/transactions/student-payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      console.log('Response data:', response.data);
      setPayments(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
      if (response.data.length > 0 && !selectedBoardingHouse) {
        setSelectedBoardingHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  // Handle boarding house change
  const handleBoardingHouseChange = (value) => {
    const newValue = value ? Number(value) : null;
    console.log('Selected boarding house changed to:', newValue);
    setSelectedBoardingHouse(newValue);
  };

  useEffect(() => {
    if (token) {
      fetchBoardingHouses();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPayments();
    }
  }, [token, selectedBoardingHouse, searchTerm]);

  // Format amount to USD
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Student Payments</h1>
        <p className="text-xs text-gray-500">Track and manage student payments</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Boarding House Selection */}
      {boardingHouses.length > 0 && (
        <div className="bg-white p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                {boardingHouses.find(bh => bh.id === selectedBoardingHouse)?.name || 'All Boarding Houses'}
              </h2>
            </div>
            <select
              className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedBoardingHouse || ''}
              onChange={(e) => handleBoardingHouseChange(e.target.value)}
            >
              <option value="">All Boarding Houses</option>
              {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>
                  {bh.name} - {bh.location}
                </option>
              ))}
            </select>
          </div>
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
                placeholder="Search payments..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiDownload size={14} />
              <span>Export</span>
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
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Reference</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Student</th>
                <th className="px-6 py-3 text-left">Room</th>
                <th className="px-6 py-3 text-left">Method</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(payment.payment_date)}</td>
                    <td className="px-6 py-4">{payment.reference_number}</td>
                    <td className="px-6 py-4 capitalize">{payment.payment_type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">{payment.student_name}</td>
                    <td className="px-6 py-4">{payment.room_name}</td>
                    <td className="px-6 py-4 capitalize">{payment.payment_method?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(payment.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
                        ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {payment.status}
                      </span>
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

export default Payments;
