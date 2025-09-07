import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaDollarSign,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const PettyCash = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [boardingHouses, setBoardingHouses] = useState([]);
  
  // Petty cash data
  const [pettyCashData, setPettyCashData] = useState({
    current_balance: 0,
    beginning_balance: 0,
    total_inflows: 0,
    total_outflows: 0,
    transactions: []
  });

  // Form states
  const [addCashForm, setAddCashForm] = useState({
    amount: '',
    description: '',
    reference_date: new Date().toISOString().split('T')[0], // Default to today
    reference_number: '',
    notes: '',
    source_account: '10002' // Default to Cash on Hand
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    purpose: '',
    reference_date: new Date().toISOString().split('T')[0], // Default to today
    reference_number: '',
    notes: '',
    destination_account: '10002' // Default to Cash on Hand
  });

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse) {
      fetchPettyCashData();
    }
  }, [selectedBoardingHouse]);

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
      // Set the first boarding house as default if available
      if (response.data.length > 0) {
        setSelectedBoardingHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchPettyCashData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/petty-cash/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse
        }
      });
      
      setPettyCashData(response.data || {
        current_balance: 0,
        beginning_balance: 0,
        total_inflows: 0,
        total_outflows: 0,
        transactions: []
      });
    } catch (error) {
      console.error('Error fetching petty cash data:', error);
      toast.error('Failed to fetch petty cash data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const cashData = {
        amount: parseFloat(addCashForm.amount),
        description: addCashForm.description,
        transaction_date: addCashForm.reference_date,
        reference_number: addCashForm.reference_number,
        notes: addCashForm.notes,
        source_account: addCashForm.source_account
      };
      
      await axios.post(`${BASE_URL}/petty-cash/add-cash`, cashData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse,
          'Content-Type': 'application/json'
        }
      });
      
      // Get source account name for better user feedback
      const sourceNames = {
        '10002': 'Cash on Hand',
        '10003': 'CBZ Bank Account',
        '10004': 'CBZ Vault'
      };
      const sourceName = sourceNames[addCashForm.source_account] || 'selected account';
      toast.success(`Cash added successfully from ${sourceName}`);
      setShowAddCashModal(false);
      resetAddCashForm();
      fetchPettyCashData();
    } catch (error) {
      console.error('Error adding cash:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add cash';
      toast.error(errorMessage);
    }
  };

  const handleWithdrawCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const withdrawData = {
        amount: parseFloat(withdrawForm.amount),
        purpose: withdrawForm.purpose,
        transaction_date: withdrawForm.reference_date,
        reference_number: withdrawForm.reference_number,
        notes: withdrawForm.notes,
        destination_account: withdrawForm.destination_account
      };
      
      await axios.post(`${BASE_URL}/petty-cash/withdraw-cash`, withdrawData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse,
          'Content-Type': 'application/json'
        }
      });
      
      // Get destination account name for better user feedback
      const destinationNames = {
        '10002': 'Cash on Hand',
        '10003': 'CBZ Bank Account',
        '10004': 'CBZ Vault'
      };
      const destinationName = destinationNames[withdrawForm.destination_account] || 'selected account';
      toast.success(`Cash withdrawn successfully to ${destinationName}`);
      setShowWithdrawModal(false);
      resetWithdrawForm();
      fetchPettyCashData();
    } catch (error) {
      console.error('Error withdrawing cash:', error);
      const errorMessage = error.response?.data?.message || 'Failed to withdraw cash';
      toast.error(errorMessage);
    }
  };



  const resetAddCashForm = () => {
    setAddCashForm({
      amount: '',
      description: '',
      reference_date: new Date().toISOString().split('T')[0], // Reset to today
      reference_number: '',
      notes: '',
      source_account: '10002' // Reset to Cash on Hand
    });
  };

  const resetWithdrawForm = () => {
    setWithdrawForm({
      amount: '',
      purpose: '',
      reference_date: new Date().toISOString().split('T')[0], // Reset to today
      reference_number: '',
      notes: '',
      destination_account: '10002' // Reset to Cash on Hand
    });
  };



  const getTransactionIcon = (type) => {
    switch (type) {
      case 'cash_inflow':
      case 'student_payment':
        return <FaArrowUp className="text-green-500" />;
      case 'cash_outflow':
      case 'withdrawal':
      case 'expense':
        return <FaArrowDown className="text-red-500" />;
      default:
        return <FaDollarSign className="text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'cash_inflow':
      case 'student_payment':
        return 'text-green-600';
      case 'cash_outflow':
      case 'withdrawal':
      case 'expense':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || !selectedBoardingHouse) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Petty Cash Management</h1>
          <p className="text-xs text-gray-500">Track cash inflows and outflows for this boarding house</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCashModal(true)}
            className="flex items-center px-4 py-2 text-xs text-white transition-colors"
            style={{ backgroundColor: '#f58020' }}
          >
            <FaPlus size={14} className="mr-2" />
            Add Cash
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center px-4 py-2 text-xs bg-red-600 text-white transition-colors hover:bg-red-700"
          >
            <FaArrowDown size={14} className="mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Boarding House Filter */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Boarding House
            </label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Boarding House</option>
              {boardingHouses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Current Balance</p>
              <p className="text-lg font-bold text-gray-900">${pettyCashData.current_balance?.toFixed(2) || '0.00'}</p>
            </div>
            <FaDollarSign className="h-5 w-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Beginning Balance (BD)</p>
              <p className="text-lg font-bold text-gray-900">${pettyCashData.beginning_balance?.toFixed(2) || '0.00'}</p>
            </div>
            <FaCalendarAlt className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Inflows</p>
              <p className="text-lg font-bold text-green-600">${pettyCashData.total_inflows?.toFixed(2) || '0.00'}</p>
            </div>
            <FaArrowUp className="h-5 w-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Outflows</p>
              <p className="text-lg font-bold text-red-600">${pettyCashData.total_outflows?.toFixed(2) || '0.00'}</p>
            </div>
            <FaArrowDown className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pettyCashData.transactions?.length > 0 ? (
                pettyCashData.transactions.map((transaction, index) => (
                  <tr key={transaction.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.transaction_type)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {transaction.transaction_type?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference_number}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTransactionColor(transaction.transaction_type)}`}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${transaction.running_balance?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cash Modal */}
      {showAddCashModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add Cash to Petty Cash</h3>
              <form onSubmit={handleAddCash}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addCashForm.amount}
                    onChange={(e) => setAddCashForm({...addCashForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={addCashForm.description}
                    onChange={(e) => setAddCashForm({...addCashForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Student cash payment"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source Account*</label>
                  <select
                    required
                    value={addCashForm.source_account}
                    onChange={(e) => setAddCashForm({...addCashForm, source_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select where the money is coming from
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={addCashForm.reference_date}
                    onChange={(e) => setAddCashForm({...addCashForm, reference_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={addCashForm.reference_number}
                    onChange={(e) => setAddCashForm({...addCashForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={addCashForm.notes}
                    onChange={(e) => setAddCashForm({...addCashForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCashModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white transition-colors"
                    style={{ backgroundColor: '#f58020' }}
                  >
                    Add Cash
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Cash Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Withdraw Cash from Petty Cash</h3>
              <form onSubmit={handleWithdrawCash}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.purpose}
                    onChange={(e) => setWithdrawForm({...withdrawForm, purpose: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Bank deposit"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination Account*</label>
                  <select
                    required
                    value={withdrawForm.destination_account}
                    onChange={(e) => setWithdrawForm({...withdrawForm, destination_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select where the withdrawn money will go
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={withdrawForm.reference_date}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reference_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={withdrawForm.reference_number}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={withdrawForm.notes}
                    onChange={(e) => setWithdrawForm({...withdrawForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default PettyCash;