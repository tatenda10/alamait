import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBoardingHouses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    totalExpenses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch dashboard data using the same endpoints as client
      const [monthlyResponse, invoiceResponse, expensesResponse, paymentResponse, activitiesResponse, roomsResponse] = await Promise.all([
        axios.get(`${BASE_URL}/dashboard/monthly-revenue`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/invoice-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/expense-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/rooms/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Calculate stats from API responses
      const rooms = roomsResponse.data || [];
      const monthlyData = monthlyResponse.data || [];
      const expensesData = expensesResponse.data || [];
      
      setStats({
        totalBoardingHouses: 3, // This would need a separate API call
        totalStudents: 45, // This would need a separate API call
        totalRevenue: monthlyData.reduce((sum, item) => sum + (item.total || 0), 0),
        totalExpenses: expensesData.reduce((sum, item) => sum + (item.total || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to mock data if API fails
      setStats({
        totalBoardingHouses: 3,
        totalStudents: 45,
        totalRevenue: 125000,
        totalExpenses: 85000
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Boarding Houses',
      value: stats.totalBoardingHouses,
      icon: '🏢',
      color: '#3b82f6'
    },
    {
      name: 'Total Students',
      value: stats.totalStudents,
      icon: '👥',
      color: '#10b981'
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: '#f59e0b'
    },
    {
      name: 'Total Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      icon: '📊',
      color: '#ef4444'
    }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
              Boss Dashboard
            </h1>
            <p style={{ color: '#6b7280', margin: '0' }}>
              Welcome back, {user?.name || user?.username}!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              marginRight: '8px'
            }}></div>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statCards.map((card) => (
          <div key={card.name} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: card.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                {card.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 4px' }}>
                  {card.name}
                </h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          <button style={{
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', marginRight: '16px' }}>🏢</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px' }}>
                  Manage Boarding Houses
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  View and manage all boarding houses
                </p>
              </div>
            </div>
          </button>
          
          <button style={{
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', marginRight: '16px' }}>👥</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px' }}>
                  View All Students
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  Manage students across all houses
                </p>
              </div>
            </div>
          </button>
          
          <button style={{
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', marginRight: '16px' }}>📊</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px' }}>
                  Financial Reports
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  View comprehensive financial reports
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px' }}>
          Recent Activity
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>✅</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px' }}>
                System Status
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                All systems operational
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '20px', marginRight: '12px' }}>⚠️</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px' }}>
                New Students
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                5 new student applications pending review
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
