import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const PettyCash = () => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAccount();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchUserAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      console.log('=== FETCHING PETTY CASH ACCOUNT ===');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Boarding House ID:', boardingHouseId);
      console.log('API URL:', `${BASE_URL}/petty-cash/account`);
      console.log('====================================');
      
      // Fetch boarding house petty cash account
      const accountResponse = await axios.get(`${BASE_URL}/petty-cash/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'boarding-house-id': boardingHouseId
        }
      });
      
      console.log('=== API RESPONSE RECEIVED ===');
      console.log('Response status:', accountResponse.status);
      console.log('Response data:', accountResponse.data);
      console.log('==============================');
      
      if (accountResponse.data && accountResponse.data.success) {
        // Transform the response to match our frontend expectations
        const accountData = accountResponse.data;
        
        console.log('=== PETTY CASH ACCOUNT RESPONSE ===');
        console.log('Full response:', accountResponse.data);
        console.log('Account data:', accountData);
        console.log('Transactions:', accountData.transactions);
        console.log('Transaction count:', accountData.transactions?.length || 0);
        console.log('Transaction types:', accountData.transactions?.map(t => t.transaction_type) || []);
        console.log('Transaction IDs:', accountData.transactions?.map(t => t.id) || []);
        console.log('===================================');
        
        setAccount({
          account_name: accountData.account_name || `Petty Cash - ${localStorage.getItem('username') || 'Account'}`,
          current_balance: accountData.current_balance,
          beginning_balance: accountData.beginning_balance,
          total_inflows: accountData.total_inflows,
          total_outflows: accountData.total_outflows
        });
        
        // Transactions are included in the account response
        setTransactions(accountData.transactions || []);
      }
    } catch (error) {
      console.error('=== ERROR FETCHING PETTY CASH ACCOUNT ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('==========================================');
      toast.error('Failed to fetch petty cash account');
      setAccount(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        icon: ClockIcon,
        label: 'Pending' 
      },
      approved: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        icon: CheckCircleIcon,
        label: 'Approved' 
      },
      rejected: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        icon: XCircleIcon,
        label: 'Rejected' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto mt-8">
      <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-b-2 border-[#E78D69]"></div>
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto mt-8">
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Petty Cash Account</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have a petty cash account assigned.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto mt-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-[#E78D69] mr-2" />
                  Petty Cash Account
                </h1>
                <p className="text-xs text-gray-500 mt-1">View your petty cash transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white border border-gray-200 mb-4">
          <div className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm font-medium text-gray-900">{account.account_name}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className="text-lg font-bold text-green-600">
                  ${parseFloat(account.current_balance || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Transactions</p>
                <p className="text-sm font-medium text-gray-900">{transactions.length}</p>
              </div>
              </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-4 w-4 text-[#E78D69] mr-2" />
              Transaction History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-3 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin h-5 w-5 border-b-2 border-[#E78D69]"></div>
                        <span className="ml-2 text-xs text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-3 py-8 text-center">
                      <div className="text-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No transactions found</p>
        </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                          transaction.transaction_type === 'expense' || transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal'
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {transaction.transaction_type === 'expense' || transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal' ? (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          )}
                          {transaction.transaction_type === 'expense' ? 'Expense' : 
                           transaction.transaction_type === 'cash_outflow' ? 'Cash Out' :
                           transaction.transaction_type === 'withdrawal' ? 'Withdrawal' :
                           transaction.transaction_type === 'cash_inflow' ? 'Cash In' :
                           transaction.transaction_type === 'student_payment' ? 'Student Payment' :
                           'Issuance'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-gray-900">{transaction.description}</div>
                        {transaction.vendor_name && (
                          <div className="text-xs text-gray-500">Vendor: {transaction.vendor_name}</div>
                        )}
                        {transaction.notes && (
                          <div className="text-xs text-gray-500">Notes: {transaction.notes}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold">
                        <span className={transaction.transaction_type === 'expense' || transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.transaction_type === 'expense' || transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal' ? '-' : '+'}${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PettyCash;