import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../context/Api';

const PaymentModal = ({ isOpen, onClose, payable, onPaymentSubmit }) => {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [pettyCashAccounts, setPettyCashAccounts] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    boarding_house_id: '',
    petty_cash_account_id: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen && payable) {
      setFormData(prev => ({
        ...prev,
        amount: payable.amount || '',
        boarding_house_id: payable.boarding_house_id || ''
      }));
      fetchBoardingHouses();
      fetchPettyCashAccounts();
    }
  }, [isOpen, payable]);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  const fetchPettyCashAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPettyCashAccounts(response.data?.users || response.data || []);
    } catch (error) {
      console.error('Error fetching petty cash accounts:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPaymentSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Make Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {payable && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Payment for:</p>
            <p className="font-medium">{payable.description}</p>
            <p className="text-sm text-gray-600">Amount: ${payable.amount}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="petty_cash">Petty Cash</option>
            </select>
          </div>

          {formData.payment_method === 'petty_cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Petty Cash Account
              </label>
              <select
                name="petty_cash_account_id"
                value={formData.petty_cash_account_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Petty Cash Account</option>
                {pettyCashAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.full_name} - ${account.current_balance}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boarding House
            </label>
            <select
              name="boarding_house_id"
              value={formData.boarding_house_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Boarding House</option>
              {boardingHouses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;