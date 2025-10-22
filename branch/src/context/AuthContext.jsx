import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../utils/api';

const AuthContext = createContext(null);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        return;
      }

      // Set the token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/pettycash/auth/profile');
      const userData = response.data.data;
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('boarding_house_id', userData.boarding_house_id?.toString() || '');
      localStorage.setItem('boarding_house_name', userData.boarding_house_name || '');
      localStorage.setItem('petty_cash_account_id', userData.petty_cash_account_id?.toString() || '');
      localStorage.setItem('account_name', userData.account_name || '');
      setUser(userData);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.clear();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await api.post('/pettycash/auth/login', credentials);
      const { data } = response.data; // Note: response.data contains the wrapper object
      
      if (!data) {
        throw new Error('No data received from server');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }

      // Store user data
      if (data.user) {
        const userData = data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('boarding_house_id', userData.boarding_house_id?.toString() || '');
        localStorage.setItem('boarding_house_name', userData.boarding_house_name || '');
        localStorage.setItem('petty_cash_account_id', userData.petty_cash_account_id?.toString() || '');
        localStorage.setItem('account_name', userData.account_name || '');
        setUser(userData);
      }
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/pettycash/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      navigate('/', { replace: true });
    }
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E78D69]"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 