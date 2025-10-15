import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import BossDashboardLayout from './components/BossDashboardLayout';
import Dashboard from './pages/Dashboard';
import AllBoardingHouses from './pages/AllBoardingHouses';
import AllStudents from './pages/AllStudents';
import AllReports from './pages/AllReports';
import AllAccounting from './pages/AllAccounting';
import AllSuppliers from './pages/AllSuppliers';
import AllRooms from './pages/AllRooms';
import AllUsers from './pages/AllUsers';
import SystemSettings from './pages/SystemSettings';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/*" element={<BossDashboardLayout />}>
        <Route path="" element={<Dashboard />} />
        <Route path="overview" element={<Dashboard />} />
        
        {/* Global Management Routes */}
        <Route path="boarding-houses" element={<AllBoardingHouses />} />
        <Route path="students" element={<AllStudents />} />
        <Route path="rooms" element={<AllRooms />} />
        <Route path="suppliers" element={<AllSuppliers />} />
        <Route path="users" element={<AllUsers />} />
        
        {/* Global Accounting Routes */}
        <Route path="accounting" element={<AllAccounting />} />
        
        {/* Global Reports Routes */}
        <Route path="reports" element={<AllReports />} />
        
        {/* System Settings */}
        <Route path="settings" element={<SystemSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;