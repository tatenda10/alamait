import React from 'react';

const AllUsers = () => {
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
          All Users
        </h1>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Manage users and permissions across all boarding houses
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '60px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
        <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', margin: '0 0 8px' }}>
          User Management
        </h3>
        <p style={{ color: '#6b7280', margin: '0' }}>
          User management functionality will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default AllUsers;
