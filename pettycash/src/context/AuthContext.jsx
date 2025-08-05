import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from './Api';

const AuthContext = createContext();

// Create axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pettycash_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/pettycash/auth/verify');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/pettycash/auth/login', credentials);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('pettycash_token', newToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pettycash_token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Get user balance
  const getBalance = async () => {
    try {
      const response = await api.get('/pettycash/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  };

  // Get user transactions
  const getTransactions = async (params = {}) => {
    try {
      const response = await api.get('/pettycash/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  // Create new transaction
  const createTransaction = async (transactionData) => {
    try {
      const response = await api.post('/pettycash/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  // Get recent transactions
  const getRecentTransactions = async () => {
    try {
      const response = await api.get('/pettycash/recent-transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  };

  // Get boarding houses
  const getBoardingHouses = async () => {
    try {
      const response = await api.get('/pettycash/boarding-houses');
      return response.data;
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      throw error;
    }
  };

  // Get reports
  const getReports = async (params = {}) => {
    try {
      const response = await api.get('/pettycash/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  };

  // Utility functions
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const isPettyCashUser = () => {
    return !!user; // All users in this app are petty cash users
  };

  const canAccessPettyCash = () => {
    return isAuthenticated() && isPettyCashUser();
  };

  const getUserInfo = () => {
    return user;
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    clearError,
    getBalance,
    getTransactions,
    createTransaction,
    getRecentTransactions,
    getBoardingHouses,
    getReports,
    isAuthenticated,
    isPettyCashUser,
    canAccessPettyCash,
    getUserInfo,
    api, // Expose api instance for other components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;