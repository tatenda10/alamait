import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BossLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'All Boarding Houses', href: '/dashboard/boarding-houses', icon: '🏢' },
    { name: 'All Students', href: '/dashboard/students', icon: '👥' },
    { name: 'All Rooms', href: '/dashboard/rooms', icon: '🏠' },
    { name: 'All Suppliers', href: '/dashboard/suppliers', icon: '🚚' },
    { name: 'All Users', href: '/dashboard/users', icon: '👤' },
    { name: 'Accounting Overview', href: '/dashboard/accounting', icon: '📊' },
    { name: 'All Reports', href: '/dashboard/reports', icon: '📄' },
    { name: 'System Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: '#f3f4f6' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-300px',
        width: '300px',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 50,
        transition: 'left 0.3s ease',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginRight: '12px'
            }}>
              👑
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
              Boss Dashboard
            </span>
          </div>
        </div>
        
        <nav style={{ padding: '20px 0' }}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
                setSidebarOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                color: isCurrentPath(item.href) ? '#1d4ed8' : '#6b7280',
                backgroundColor: isCurrentPath(item.href) ? '#dbeafe' : 'transparent',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'none'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginRight: '12px'
            }}>
              👑
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
              Boss Dashboard
            </span>
          </div>
        </div>
        
        <nav style={{ padding: '20px 0' }}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                color: isCurrentPath(item.href) ? '#1d4ed8' : '#6b7280',
                backgroundColor: isCurrentPath(item.href) ? '#dbeafe' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          padding: '15px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#e5e7eb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6b7280',
              marginRight: '12px'
            }}>
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'B'}
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {user?.name || user?.username || 'Boss User'}
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                {user?.role || 'Boss'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#6b7280'
            }}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile header */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ☰
          </button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            Boss Dashboard
          </div>
          <div style={{ width: '20px' }}></div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default BossLayout;
