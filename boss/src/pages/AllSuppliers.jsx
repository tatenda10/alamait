import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../context/Api';

const AllSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // Mock data for demo
      setSuppliers([
        {
          id: 1,
          name: 'City Council',
          type: 'Government',
          contact: 'John Smith',
          phone: '+1234567890',
          email: 'john@citycouncil.gov',
          status: 'active'
        },
        {
          id: 2,
          name: 'Electricity Company',
          type: 'Utility',
          contact: 'Sarah Johnson',
          phone: '+1234567891',
          email: 'sarah@electricity.com',
          status: 'active'
        },
        {
          id: 3,
          name: 'Water Authority',
          type: 'Utility',
          contact: 'Mike Brown',
          phone: '+1234567892',
          email: 'mike@water.gov',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
          All Suppliers
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Manage suppliers and vendors across all boarding houses
        </p>
      </div>

      {loading ? (
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
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', margin: '0' }}>
              Supplier Directory
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Supplier
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Type
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contact
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          marginRight: '16px'
                        }}>
                          🚚
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            {supplier.name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            ID: {supplier.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        {supplier.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
                        {supplier.contact}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                        <span style={{ marginRight: '4px' }}>📞</span>
                        {supplier.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <span style={{ marginRight: '4px' }}>✉️</span>
                        {supplier.email}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: supplier.status === 'active' ? '#d1fae5' : '#f3f4f6',
                        color: supplier.status === 'active' ? '#065f46' : '#6b7280'
                      }}>
                        {supplier.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button style={{
                        color: '#3b82f6',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginRight: '12px'
                      }}>
                        View
                      </button>
                      <button style={{
                        color: '#10b981',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default AllSuppliers;
