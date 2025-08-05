import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiEye, FiPlus, FiFilter, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import PaymentModal from '../../components/PaymentModal';
import BASE_URL from '../../context/Api';
const AccountsPayable = () => {
  const [accountsPayable, setAccountsPayable] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, payable: null });
  
  const token = localStorage.getItem('token');
  const isLoadingRef = useRef(false);

  // Fetch accounts payable
  const fetchAccountsPayable = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('⏸️ fetchAccountsPayable already in progress, skipping...');
      return;
    }
    
    try {
      console.log('🔄 Starting fetchAccountsPayable...');
      isLoadingRef.current = true;
      setLoading(true);
      const boardingHouseParam = selectedBoardingHouse ? `?boarding_house_id=${selectedBoardingHouse}` : '';
      console.log('📡 Making API call to:', `${BASE_URL}/accounts-payable${boardingHouseParam}`);
      
      const response = await axios.get(`${BASE_URL}/accounts-payable${boardingHouseParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 API Response received:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        fullResponse: response.data
      });
      
      if (response.data?.data) {
        console.log('🔍 Raw accounts payable data from API:', response.data.data);
        
        // Check each item in detail
        response.data.data.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            id: item.id,
            description: item.description,
            payment_method: item.payment_method,
            amount: item.amount,
            isPettyCash: item.description && item.description.toLowerCase().includes('petty cash')
          });
        });
        
        // Filter out any petty cash transactions as a safety measure
        const filteredPayables = response.data.data.filter(payable => {
          const isCredit = payable.payment_method === 'credit';
          const isPettyCash = payable.description && payable.description.toLowerCase().includes('petty cash');
          const shouldInclude = isCredit && !isPettyCash;
          
          console.log(`Filtering item ${payable.id}:`, {
            description: payable.description,
            payment_method: payable.payment_method,
            isCredit,
            isPettyCash,
            shouldInclude
          });
          
          return shouldInclude;
        });
        
        console.log('✅ Setting accountsPayable state with filtered data:', filteredPayables);
        setAccountsPayable(filteredPayables);
        
        // Log any petty cash items that might have been included
        const pettyCashItems = response.data.data.filter(payable => 
          payable.description && payable.description.toLowerCase().includes('petty cash')
        );
        if (pettyCashItems.length > 0) {
          console.error('🚨 CRITICAL: Petty cash items found in accounts payable API response:', pettyCashItems);
        }
      } else {
        console.log('❌ No data in response, setting empty array');
        setAccountsPayable([]);
      }
    } catch (error) {
      console.error('💥 Error fetching accounts payable:', error);
      setAccountsPayable([]);
      setError(`Failed to fetch accounts payable: ${error.response?.data?.message || error.message}`);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log('✅ fetchAccountsPayable completed');
    }
  }, [selectedBoardingHouse, token]);

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
      if (response.data.length > 0) {
        setSelectedBoardingHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  // Monitor accountsPayable state changes
  useEffect(() => {
    console.log('🔄 accountsPayable state changed:', {
      length: accountsPayable.length,
      data: accountsPayable,
      timestamp: new Date().toISOString()
    });
  }, [accountsPayable]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchBoardingHouses();
    }
  }, [token]);

  // Fetch accounts payable when boarding house changes
  useEffect(() => {
    if (token && selectedBoardingHouse !== undefined) {
      const timeoutId = setTimeout(() => {
        fetchAccountsPayable();
      }, 100); // Small delay to prevent rapid successive calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBoardingHouse, token]);

  // Format amount to USD
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter accounts payable based on search
  const filteredAccountsPayable = accountsPayable.filter(payable => {
    const matchesSearch = searchTerm === '' || 
      payable.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handle make payment
  const handleMakePayment = (payable) => {
    setPaymentModal({ isOpen: true, payable });
  };

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    try {
      console.log('Payment modal payable:', paymentModal.payable);
      console.log('Payment data being sent:', {
        expense_id: paymentModal.payable.id,
        ...paymentData
      });
      
      const response = await axios.post(`${BASE_URL}/supplier-payments`, {
        expense_id: paymentModal.payable.id,
        ...paymentData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        // Refresh accounts payable data
        await fetchAccountsPayable();
        setPaymentModal({ isOpen: false, payable: null });
        
        // Show success message (you can add a toast notification here)
        console.log('Payment recorded successfully');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      console.error('Full error response:', error.response);
      setError(`Failed to record payment: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Accounts Payable</h1>
        <p className="text-xs text-gray-500">Manage outstanding credit expenses and supplier payments</p>
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
              onChange={(e) => setSelectedBoardingHouse(e.target.value ? Number(e.target.value) : null)}
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

      {/* Controls */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="p-4">
          {/* Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search accounts payable..."
                  className="pl-8 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
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
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Supplier</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Reference</th>
                <th className="px-6 py-3 text-right">Total Amount</th>
                <th className="px-6 py-3 text-right">Paid Amount</th>
                <th className="px-6 py-3 text-right">Balance Due</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading accounts payable...
                  </td>
                </tr>
              ) : filteredAccountsPayable.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts payable found
                  </td>
                </tr>
              ) : (
                filteredAccountsPayable.map((payable) => (
                  <tr key={payable.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(payable.date || payable.created_at)}</td>
                    <td className="px-6 py-4">{payable.supplier_name || '-'}</td>
                    <td className="px-6 py-4">{payable.description}</td>
                    <td className="px-6 py-4">{payable.invoice_number || payable.reference_number || '-'}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(payable.amount)}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(payable.amount - payable.balance)}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(payable.balance)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payable.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : payable.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payable.status === 'paid' ? 'Paid' : payable.status === 'partial' ? 'Partial' : 'Outstanding'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Make payment"
                        onClick={() => handleMakePayment(payable)}
                      >
                        <FiPlus size={14} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, payable: null })}
        payable={paymentModal.payable}
        onSubmit={handlePaymentSubmit}
        formatAmount={formatAmount}
      />
    </div>
  );
};

export default AccountsPayable;