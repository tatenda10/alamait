import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiEye, FiPlus, FiFilter, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import PaymentModal from '../../components/PaymentModal';
import BASE_URL from '../../context/Api';
import AddAccountsPayableModal from '../suppliers/AddAccountsPayableModal';
const AccountsPayable = () => {
  const [accountsPayable, setAccountsPayable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, payable: null });
  const [showAddPayableModal, setShowAddPayableModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  
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
      console.log('📡 Making API call to:', `${BASE_URL}/accounts-payable`);
      
      const response = await axios.get(`${BASE_URL}/accounts-payable`, {
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
            amount: item.amount,
            expense_account_name: item.expense_account_name,
            expense_account_code: item.expense_account_code,
            payable_account_name: item.payable_account_name,
            payable_account_code: item.payable_account_code,
            boarding_house_name: item.boarding_house_name
          });
        });
        
        // Use the data directly from the API (no filtering needed since backend already filters correctly)
        console.log('✅ Setting accountsPayable state with data:', response.data.data);
        setAccountsPayable(response.data.data);
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
  }, [token]);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Handle add payable success
  const handleAddPayableSuccess = () => {
    fetchAccountsPayable(); // Refresh the accounts payable data
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
      fetchSuppliers();
      fetchAccountsPayable();
    }
  }, [token]);

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

  // Handle view details
  const handleViewDetails = (payable) => {
    // For now, we'll just show an alert with the details
    // You can replace this with a modal or navigate to a details page
    const details = `
Accounts Payable Details:
• Date: ${formatDate(payable.created_at)}
• Boarding House: ${payable.boarding_house_name || 'N/A'}
• Expense Account: ${payable.expense_account_name} (${payable.expense_account_code})
• Payable Account: ${payable.payable_account_name} (${payable.payable_account_code})
• Description: ${payable.description}
• Amount: ${formatAmount(payable.amount)}
• Status: Outstanding
• Transaction ID: ${payable.transaction_id}
    `.trim();
    
    alert(details);
  };

  // Filter accounts payable based on search
  const filteredAccountsPayable = accountsPayable.filter(payable => {
    const matchesSearch = searchTerm === '' || 
      payable.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.expense_account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.expense_account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.payable_account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.payable_account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payable.boarding_house_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
        accounts_payable_id: paymentModal.payable.id,
        transaction_id: paymentModal.payable.transaction_id,
        ...paymentData
      });
      
      const response = await axios.post(`${BASE_URL}/accounts-payable/payment`, {
        accounts_payable_id: paymentModal.payable.id,
        transaction_id: paymentModal.payable.transaction_id,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        boarding_house_id: parseInt(paymentData.boarding_house_id),
        petty_cash_account_id: paymentData.petty_cash_account_id ? parseInt(paymentData.petty_cash_account_id) : null
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
        alert('Payment recorded successfully!');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Accounts Payable</h1>
            <p className="text-xs text-gray-500">Manage outstanding credit expenses and supplier payments</p>
          </div>
          <button
            onClick={() => setShowAddPayableModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add Accounts Payable
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
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
                  placeholder="Search by expense account, payable account, description, or boarding house..."
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
                <th className="px-6 py-3 text-left">Boarding House</th>
                <th className="px-6 py-3 text-left">Expense Account</th>
                <th className="px-6 py-3 text-left">Payable Account</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading accounts payable...
                  </td>
                </tr>
              ) : filteredAccountsPayable.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts payable found
                  </td>
                </tr>
              ) : (
                filteredAccountsPayable.map((payable) => (
                  <tr key={payable.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(payable.created_at)}</td>
                    <td className="px-6 py-4">{payable.boarding_house_name || '-'}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{payable.expense_account_name || '-'}</div>
                        <div className="text-gray-500 text-xs">{payable.expense_account_code || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{payable.payable_account_name || '-'}</div>
                        <div className="text-gray-500 text-xs">{payable.payable_account_code || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{payable.description}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(payable.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Outstanding
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="View details"
                        onClick={() => handleViewDetails(payable)}
                      >
                        <FiEye size={14} />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-700 transition-colors"
                        title="Make payment"
                        onClick={() => handleMakePayment(payable)}
                      >
                        💳
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
        onPaymentSubmit={handlePaymentSubmit}
        formatAmount={formatAmount}
      />

      {/* Add Accounts Payable Modal */}
      {showAddPayableModal && (
        <AddAccountsPayableModal
          supplier={null} // No specific supplier selected
          onClose={() => setShowAddPayableModal(false)}
          onSuccess={handleAddPayableSuccess}
        />
      )}
    </div>
  );
};

export default AccountsPayable;