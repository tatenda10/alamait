import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import BASE_URL from '../../utils/api';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/change-password`,
        {
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Password changed successfully');
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (name, label, placeholder) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={showPasswords[name] ? "text" : "password"}
          name={name}
          id={name}
          value={formData[name]}
          onChange={handleChange}
          className={`block w-full px-3 py-2 text-sm border ${
            errors[name]
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-200 focus:border-[#E78D69] focus:ring-[#E78D69]'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(name)}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          {showPasswords[name] ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Change Password</h1>
        <p className="mt-1 text-xs text-gray-600">
          Update your password to keep your account secure
        </p>
      </div>

      <div className="bg-white border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {renderPasswordInput(
            "currentPassword",
            "Current Password",
            "Enter your current password"
          )}

          {renderPasswordInput(
            "newPassword",
            "New Password",
            "Enter your new password"
          )}

          {renderPasswordInput(
            "confirmPassword",
            "Confirm New Password",
            "Confirm your new password"
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex justify-center px-4 py-2 text-sm font-semibold text-white
                ${loading 
                  ? 'bg-[#E78D69]/70 cursor-not-allowed' 
                  : 'bg-[#E78D69] hover:bg-[#E78D69]/90'
                }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></span>
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-white border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Password Requirements</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Must be at least 8 characters long</li>
          <li>• Should contain at least one uppercase letter</li>
          <li>• Should contain at least one number</li>
          <li>• Should contain at least one special character</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword; 