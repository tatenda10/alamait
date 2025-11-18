import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaDollarSign,
  FaExchangeAlt,
  FaUniversity,
  FaHandHoldingUsd,
  FaChartLine
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const Banking = () => {
  const [loading, setLoading] = useState(true);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  
  // Banking data
  const [bankingData, setBankingData] = useState({
    accounts: [],
    transactions: [],
    balances: {}
  });

  const [addBalanceForm, setAddBalanceForm] = useState({
    account_code: '10002',
    source_account: '30004', // Default to Opening Balance Equity
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    from_account: '10002',
    to_account: '10003',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });



  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    account_code: '10002',
    opening_balance: '',
    as_of_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    if (selectedBoardingHouse) {
      fetchBankingData();
    }
  }, [selectedBoardingHouse]);

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBoardingHouses(response.data);
      if (response.data.length > 0) {
        setSelectedBoardingHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchBankingData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch account balances
      const balancesResponse = await axios.get(`${BASE_URL}/banking/balances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse
        }
      });

      // Fetch recent transactions
      const transactionsResponse = await axios.get(`${BASE_URL}/banking/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse
        }
      });

      setBankingData({
        accounts: balancesResponse.data?.accounts || [],
        transactions: transactionsResponse.data?.transactions || [],
        balances: balancesResponse.data?.balances || {}
      });
    } catch (error) {
      console.error('Error fetching banking data:', error);
      toast.error('Failed to fetch banking data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const balanceData = {
        account_code: addBalanceForm.account_code,
        source_account: addBalanceForm.source_account,
        amount: parseFloat(addBalanceForm.amount),
        description: addBalanceForm.description,
        transaction_date: addBalanceForm.transaction_date,
        reference_number: addBalanceForm.reference_number,
        notes: addBalanceForm.notes
      };
      
      console.log('Sending balance data:', balanceData);
      console.log('API URL:', `${BASE_URL}/banking/add-balance`);
      
      const response = await axios.post(`${BASE_URL}/banking/add-balance`, balanceData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response received:', response.data);
      
      toast.success('Balance added successfully');
      setShowAddBalanceModal(false);
      resetAddBalanceForm();
      fetchBankingData();
    } catch (error) {
      console.error('Error adding balance:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error('Failed to add balance');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const transferData = {
        from_account: transferForm.from_account,
        to_account: transferForm.to_account,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description,
        transaction_date: transferForm.transaction_date,
        reference_number: transferForm.reference_number,
        notes: transferForm.notes
      };
      
      console.log('Sending transfer data:', transferData);
      console.log('API URL:', `${BASE_URL}/banking/transfer`);
      
      const response = await axios.post(`${BASE_URL}/banking/transfer`, transferData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response received:', response.data);
      
      toast.success('Transfer completed successfully');
      setShowTransferModal(false);
      resetTransferForm();
      fetchBankingData();
    } catch (error) {
      console.error('Error processing transfer:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error('Failed to process transfer');
    }
  };



  const handleOpeningBalance = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const openingBalanceData = {
        account_code: openingBalanceForm.account_code,
        opening_balance: parseFloat(openingBalanceForm.opening_balance),
        as_of_date: openingBalanceForm.as_of_date,
        notes: openingBalanceForm.notes
      };
      
      console.log('Sending opening balance data:', openingBalanceData);
      console.log('API URL:', `${BASE_URL}/banking/set-opening-balance`);
      console.log('Headers:', {
        'Authorization': `Bearer ${token}`,
        'boarding-house-id': selectedBoardingHouse,
        'Content-Type': 'application/json'
      });
      
      const response = await axios.post(`${BASE_URL}/banking/set-opening-balance`, openingBalanceData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': selectedBoardingHouse,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response received:', response.data);
      
      toast.success('Opening balance set successfully');
      setShowOpeningBalanceModal(false);
      resetOpeningBalanceForm();
      fetchBankingData();
    } catch (error) {
      console.error('Error setting opening balance:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error('Failed to set opening balance');
    }
  };

  const resetAddBalanceForm = () => {
    setAddBalanceForm({
      account_code: '10002',
      source_account: '30001',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };

  const resetTransferForm = () => {
    setTransferForm({
      from_account: '10002',
      to_account: '10003',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };



  const resetOpeningBalanceForm = () => {
    setOpeningBalanceForm({
      account_code: '10002',
      opening_balance: '',
      as_of_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  if (loading || !selectedBoardingHouse) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Banking & Cash Management</h1>
          <p className="text-xs text-gray-500">Manage bank accounts, cash accounts, transfers, and balances</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddBalanceModal(true)}
            className="flex items-center px-4 py-2 text-xs text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <FaPlus size={14} className="mr-2" />
            Add Balance
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <FaExchangeAlt size={14} className="mr-2" />
            Transfer
          </button>

          <button
            onClick={() => setShowOpeningBalanceModal(true)}
            className="flex items-center px-4 py-2 text-xs text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <FaChartLine size={14} className="mr-2" />
            Opening Balance
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

      {/* Account Balances Summary - Showing actual COA balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Petty Cash</p>
              <p className="text-lg font-bold text-gray-900">
                ${(bankingData.balances['10001'] || 0).toFixed(2)}
              </p>
            </div>
            <FaHandHoldingUsd className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Cash on Hand</p>
              <p className="text-lg font-bold text-gray-900">
                ${(bankingData.balances['10002'] || 0).toFixed(2)}
              </p>
            </div>
            <FaHandHoldingUsd className="h-5 w-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">CBZ Bank Account</p>
              <p className="text-lg font-bold text-gray-900">
                ${(bankingData.balances['10003'] || 0).toFixed(2)}
              </p>
            </div>
            <FaUniversity className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">CBZ Vault</p>
              <p className="text-lg font-bold text-gray-900">
                ${(bankingData.balances['10004'] || 0).toFixed(2)}
              </p>
            </div>
            <FaDollarSign className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Add Balance Modal */}
      {showAddBalanceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add Balance to Account</h3>
              <form onSubmit={handleAddBalance}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                  <select
                    required
                    value={addBalanceForm.account_code}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, account_code: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source Account</label>
                  <select
                    required
                    value={addBalanceForm.source_account}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, source_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="30004">30004 - Opening Balance Equity</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addBalanceForm.amount}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={addBalanceForm.description}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Cash deposit"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={addBalanceForm.transaction_date}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, transaction_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={addBalanceForm.reference_number}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={addBalanceForm.notes}
                    onChange={(e) => setAddBalanceForm({...addBalanceForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBalanceModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Add Balance
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Transfer Between Accounts</h3>
              <form onSubmit={handleTransfer}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Account</label>
                  <select
                    required
                    value={transferForm.from_account}
                    onChange={(e) => setTransferForm({...transferForm, from_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Account</label>
                  <select
                    required
                    value={transferForm.to_account}
                    onChange={(e) => setTransferForm({...transferForm, to_account: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={transferForm.description}
                    onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Bank deposit"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={transferForm.transaction_date}
                    onChange={(e) => setTransferForm({...transferForm, transaction_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={transferForm.reference_number}
                    onChange={(e) => setTransferForm({...transferForm, reference_number: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* Opening Balance Modal */}
      {showOpeningBalanceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Set Opening Balance</h3>
              <form onSubmit={handleOpeningBalance}>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                  <select
                    required
                    value={openingBalanceForm.account_code}
                    onChange={(e) => setOpeningBalanceForm({...openingBalanceForm, account_code: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="10002">10002 - Cash (Cash on Hand)</option>
                    <option value="10003">10003 - CBZ Bank Account</option>
                    <option value="10004">10004 - CBZ Vault</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingBalanceForm.opening_balance}
                    onChange={(e) => setOpeningBalanceForm({...openingBalanceForm, opening_balance: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter opening balance"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">As of Date</label>
                  <input
                    type="date"
                    required
                    value={openingBalanceForm.as_of_date}
                    onChange={(e) => setOpeningBalanceForm({...openingBalanceForm, as_of_date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={openingBalanceForm.notes}
                    onChange={(e) => setOpeningBalanceForm({...openingBalanceForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowOpeningBalanceModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    Set Opening Balance
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

export default Banking;
