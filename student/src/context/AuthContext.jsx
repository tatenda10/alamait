import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if student is logged in
    const token = localStorage.getItem('studentToken');
    const studentInfo = localStorage.getItem('studentInfo');

    if (token && studentInfo) {
      setIsAuthenticated(true);
      setStudent(JSON.parse(studentInfo));
    }
    
    setLoading(false);
  }, []);

  const login = (token, studentData) => {
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentInfo', JSON.stringify(studentData));
    setIsAuthenticated(true);
    setStudent(studentData);
  };

  const logout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    setIsAuthenticated(false);
    setStudent(null);
  };

  const value = {
    isAuthenticated,
    student,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
