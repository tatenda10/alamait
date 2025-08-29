import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const AccountLedger = () => {
  const { accountId, periodId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [periodInfo, setPeriodInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLedgerData();
  }, [accountId, periodId]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching ledger data for account:', accountId, 'period:', periodId);

      // Fetch account ledger with BD/CD
      const [ledgerResponse, accountResponse, periodResponse] = await Promise.all([
        axios.get(`${BASE_URL}/balance/accounts/${accountId}/periods/${periodId}/ledger`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/coa/${accountId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/balance/periods/${periodId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

             console.log('📊 Ledger data:', ledgerResponse.data);
       console.log('📋 Account info:', accountResponse.data);
       console.log('📅 Period info:', periodResponse.data);
       
       // Debug: Check for NaN values
       ledgerResponse.data.forEach((entry, index) => {
         if (isNaN(entry.running_balance)) {
           console.log(`❌ NaN found at index ${index}:`, entry);
         }
       });

      setLedger(ledgerResponse.data);
      setAccountInfo(accountResponse.data);
      setPeriodInfo(periodResponse.data);
    } catch (error) {
      console.error('❌ Error fetching ledger data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(`Failed to load ledger data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'Asset': return 'text-blue-600';
      case 'Liability': return 'text-red-600';
      case 'Equity': return 'text-green-600';
      case 'Revenue': return 'text-purple-600';
      case 'Expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/accounting/balance-bd-cd')}
            className="px-4 py-2 bg-[#E78D69] text-white rounded hover:bg-[#E78D69]/80"
          >
            Back to Balance BD/CD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/accounting/balance-bd-cd')}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="h-5 w-5 mr-2" />
                Back to Balance BD/CD
              </button>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">Account Ledger</h1>
              <p className="text-sm text-gray-500">Transaction details with BD/CD balances</p>
            </div>
          </div>
        </div>

        {/* Account and Period Info */}
        {accountInfo && periodInfo && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <FiFileText className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">Account Information</h3>
                  <p className="text-sm text-gray-500">
                    {accountInfo.code} - {accountInfo.name}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(accountInfo.type)}`}>
                    {accountInfo.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <FiCalendar className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">Period Information</h3>
                  <p className="text-sm text-gray-500">
                    {periodInfo.period_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(periodInfo.period_start_date)} - {formatDate(periodInfo.period_end_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction Ledger</h3>
          </div>

          {ledger.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions found for this account and period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledger.map((entry, index) => (
                    <tr key={`${entry.transaction_id}-${entry.journal_entry_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.transaction_date ? formatDate(entry.transaction_date) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.reference || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          {entry.balance_brought_down > 0 && (
                            <div className="text-xs text-gray-500 mb-1">
                              Balance Brought Down (BD)
                            </div>
                          )}
                          {entry.balance_carried_down > 0 && (
                            <div className="text-xs text-gray-500 mb-1">
                              Balance Carried Down (CD)
                            </div>
                          )}
                          {entry.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                         {entry.running_balance !== null && !isNaN(entry.running_balance) ? formatCurrency(entry.running_balance) : '-'}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {entry.balance_brought_down > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            BD
                          </span>
                        ) : entry.balance_carried_down > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            CD
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {entry.entry_type?.toUpperCase() || 'TXN'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {ledger.length > 0 && (
          <div className="mt-6 bg-white p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                             <div>
                 <span className="text-gray-500">Total Debits:</span>
                 <span className="ml-2 font-medium">
                   {formatCurrency(ledger.reduce((sum, entry) => sum + (parseFloat(entry.debit_amount) || 0), 0))}
                 </span>
               </div>
               <div>
                 <span className="text-gray-500">Total Credits:</span>
                 <span className="ml-2 font-medium">
                   {formatCurrency(ledger.reduce((sum, entry) => sum + (parseFloat(entry.credit_amount) || 0), 0))}
                 </span>
               </div>
               <div>
                 <span className="text-gray-500">Final Balance:</span>
                 <span className="ml-2 font-medium">
                   {ledger.length > 0 && !isNaN(ledger[ledger.length - 1].running_balance) ? formatCurrency(ledger[ledger.length - 1].running_balance) : '-'}
                 </span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLedger;
