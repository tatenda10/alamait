import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated, clearError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
    setLocalError('');
  }, [clearError]);

  // Clear local error when user starts typing
  useEffect(() => {
    if (username || password) {
      setLocalError('');
    }
  }, [username, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(''); // Clear any previous errors
    clearError(); // Clear AuthContext errors

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/home');
      } else {
        setLocalError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Faded custom navy blue gradient (3/5) with centered text */}
      <div className="hidden md:flex md:basis-3/5 items-center justify-center" style={{ background: 'linear-gradient(135deg, #02031E 0%, #23244a 100%)', opacity: 0.9 }}>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-center px-8">Petty Cash Portal</h1>
      </div>
      {/* Right: Login card (2/5), no border */}
      <div className="flex flex-1 md:basis-2/5 items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm bg-white">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-900 mb-2 tracking-tight">Petty Cash Login</h1>
            <p className="text-gray-600 text-center">Access your petty cash management portal</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-700 mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.021-2.021A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10S2 14.523 2 9c0-1.657.403-3.22 1.125-4.575M4.222 4.222l15.556 15.556" /></svg>
                  )}
                </button>
              </div>
            </div>
            {(localError || error) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-center text-sm font-medium">
                {localError || error}
              </div>
            )}
            <button
              type="submit"
              style={{ backgroundColor: '#E78D69' }}
              className="w-full py-3 px-4 text-white font-bold transition disabled:opacity-60 text-lg tracking-wide mt-2 hover:bg-[#e07a4e] focus:bg-[#e07a4e]"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;