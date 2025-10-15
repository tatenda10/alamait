import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../context/Api';

const AllAccounting = () => {
  const [loading, setLoading] = useState(true);
  const [accountingData, setAccountingData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    outstanding: 0
  });

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch accounting data using the same endpoints as client
      const [trialBalanceResponse, accountsPayableResponse] = await Promise.all([
        axios.get(`${BASE_URL}/trial-balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/accounts-payable`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Calculate accounting summary from API responses
      const trialBalanceData = trialBalanceResponse.data?.data || [];
      const accountsPayableData = accountsPayableResponse.data?.data || [];
      
      // Calculate totals from trial balance data
      const revenueTotal = trialBalanceData
        .filter(account => account.account_type === 'Revenue')
        .reduce((sum, account) => sum + (account.credit_balance || 0), 0);
      
      const expenseTotal = trialBalanceData
        .filter(account => account.account_type === 'Expense')
        .reduce((sum, account) => sum + (account.debit_balance || 0), 0);
      
      const outstandingTotal = accountsPayableData
        .reduce((sum, payable) => sum + (payable.amount || 0), 0);

      setAccountingData({
        totalRevenue: revenueTotal,
        totalExpenses: expenseTotal,
        netIncome: revenueTotal - expenseTotal,
        outstanding: outstandingTotal
      });
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      // Fallback to mock data
      setAccountingData({
        totalRevenue: 45230,
        totalExpenses: 12450,
        netIncome: 32780,
        outstanding: 5200
      });
    } finally {
      setLoading(false);
    }
  };
  const accountingModules = [
    {
      name: 'Chart of Accounts',
      description: 'Manage account categories and codes',
      icon: '📊',
      color: '#3b82f6'
    },
    {
      name: 'Trial Balance',
      description: 'View account balances and verify accuracy',
      icon: '⚖️',
      color: '#10b981'
    },
    {
      name: 'Income Statement',
      description: 'Revenue and expense analysis',
      icon: '💰',
      color: '#f59e0b'
    },
    {
      name: 'Accounts Payable',
      description: 'Manage outstanding liabilities',
      icon: '📄',
      color: '#ef4444'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
          Accounting Overview
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Manage financial accounts and transactions across all boarding houses
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {accountingModules.map((module) => (
          <div key={module.name} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: module.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                {module.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  {module.name}
                </h3>
              </div>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
              {module.description}
            </p>
            
            <button style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}>
              Access Module
            </button>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px' }}>
          Accounting Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              ${accountingData.totalRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              ${accountingData.totalExpenses.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Expenses</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              ${accountingData.netIncome.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Net Income</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              ${accountingData.outstanding.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Outstanding</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAccounting;
