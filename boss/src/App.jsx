import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import IncomeStatement from './pages/IncomeStatement';
import Cashflow from './pages/Cashflow';
import BalanceSheet from './pages/BalanceSheet';
import ExpensesReport from './pages/ExpensesReport';
import BedsAndRooms from './pages/BedsAndRooms';
import ExpenditureRequests from './pages/ExpenditureRequests';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/income-statement"
        element={
          <ProtectedRoute>
            <IncomeStatement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cashflow"
        element={
          <ProtectedRoute>
            <Cashflow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/balance-sheet"
        element={
          <ProtectedRoute>
            <BalanceSheet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/expenses-report"
        element={
          <ProtectedRoute>
            <ExpensesReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/beds-rooms"
        element={
          <ProtectedRoute>
            <BedsAndRooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/expenditure-requests"
        element={
          <ProtectedRoute>
            <ExpenditureRequests />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
