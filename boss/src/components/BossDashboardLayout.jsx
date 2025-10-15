import React from 'react';
import BossLayout from '../components/BossLayout';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BossDashboardLayout = () => {
  const location = useLocation();
  const { token, user } = useAuth();
  
  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <BossLayout>
      <Outlet />
    </BossLayout>
  );
};

export default BossDashboardLayout;
