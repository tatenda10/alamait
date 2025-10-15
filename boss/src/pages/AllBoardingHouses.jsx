import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../context/Api';

const AllBoardingHouses = () => {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setBoardingHouses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      // Mock data for demo
      setBoardingHouses([
        { id: 1, name: 'Main Campus House', address: '123 Main St', phone: '+1234567890', capacity: 50, status: 'active' },
        { id: 2, name: 'Downtown House', address: '456 Downtown Ave', phone: '+1234567891', capacity: 30, status: 'active' },
        { id: 3, name: 'Suburban House', address: '789 Suburb Rd', phone: '+1234567892', capacity: 25, status: 'active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
          All Boarding Houses
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Manage all boarding houses across the system
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {boardingHouses.map((house) => (
          <div key={house.id} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                🏢
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>
                  {house.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  ID: {house.id}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>📍</span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {house.address || 'No address provided'}
                </span>
              </div>
              
              {house.phone && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>📞</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {house.phone}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>👥</span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {house.capacity || 0} capacity
                </span>
              </div>
            </div>
            
            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Status:</span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: house.status === 'active' ? '#d1fae5' : '#f3f4f6',
                color: house.status === 'active' ? '#065f46' : '#6b7280'
              }}>
                {house.status || 'Unknown'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {boardingHouses.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px' }}>
            No Boarding Houses Found
          </h3>
          <p style={{ color: '#6b7280', margin: '0' }}>
            No boarding houses have been created yet.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AllBoardingHouses;
