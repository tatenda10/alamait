import React from 'react';
import Layout from './Layout';
import Dashboard from '../pages/shared/Dashboard';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const { token, user } = useAuth();
  
  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  
  // If at /dashboard exactly, show Dashboard, else render nested route
  const isDashboardRoot = location.pathname === '/dashboard';
  return (
    <Layout>
      {isDashboardRoot ? <Dashboard /> : <Outlet />}
    </Layout>
  );
};

export default DashboardLayout;