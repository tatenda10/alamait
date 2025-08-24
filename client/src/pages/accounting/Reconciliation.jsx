import React, { useState, useEffect } from 'react';
import { FaBalanceScale, FaDownload, FaEye, FaCheck } from 'react-icons/fa';

const Reconciliation = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setAccounts([
      { id: 1, code: '10003', name: 'CBZ Bank Account', currentBalance: 1609.12 },
      { id: 2, code: '10004', name: 'CBZ Vault', currentBalance: 5000.00 },
      { id: 3, code: '10001', name: 'Petty Cash', currentBalance: 250.00 }
    ]);
  }, []);

  const handleCreateReconciliation = () => {
    if (!selectedAccount) return;
    
    // Mock reconciliation creation
    const newReconciliation = {
      id: Date.now(),
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      reconciliationDate: new Date().toISOString().split('T')[0],
      bookBalance: selectedAccount.currentBalance,
      bankBalance: 0,
      status: 'pending',
      items: []
    };
    
    setReconciliations([newReconciliation, ...reconciliations]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Account Reconciliation</h1>
        <button
          onClick={handleCreateReconciliation}
          disabled={!selectedAccount}
          className="bg-[#E78D69] text-white px-4 py-2 rounded-lg hover:bg-[#E78D69]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaBalanceScale className="inline mr-2" />
          New Reconciliation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Select Account</h2>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedAccount?.id === account.id
                    ? 'border-[#E78D69] bg-[#E78D69]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{account.name}</div>
                <div className="text-sm text-gray-600">Code: {account.code}</div>
                <div className="text-sm font-semibold text-green-600">
                  Balance: ${account.currentBalance.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reconciliation List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Reconciliations</h2>
          {reconciliations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaBalanceScale className="mx-auto h-12 w-12 mb-4" />
              <p>No reconciliations found</p>
              <p className="text-sm">Select an account and create a new reconciliation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reconciliations.map((reconciliation) => (
                <div
                  key={reconciliation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{reconciliation.accountName}</h3>
                      <p className="text-sm text-gray-600">
                        Date: {reconciliation.reconciliationDate}
                      </p>
                      <p className="text-sm text-gray-600">
                        Book Balance: ${reconciliation.bookBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reconciliation.status === 'reconciled'
                            ? 'bg-green-100 text-green-800'
                            : reconciliation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {reconciliation.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <FaCheck className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-[#E78D69] hover:bg-[#E78D69]/5 transition-colors">
            <FaDownload className="h-5 w-5 mr-2 text-[#E78D69]" />
            Export Ledger
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-[#E78D69] hover:bg-[#E78D69]/5 transition-colors">
            <FaBalanceScale className="h-5 w-5 mr-2 text-[#E78D69]" />
            View Account Balances
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-[#E78D69] hover:bg-[#E78D69]/5 transition-colors">
            <FaEye className="h-5 w-5 mr-2 text-[#E78D69]" />
            Transaction History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
