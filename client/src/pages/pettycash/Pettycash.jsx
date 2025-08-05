import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaEdit,
  FaTrash,
  FaEye,
  FaUser,
  FaTimes,
  FaCheck,
  FaFileAlt,
  FaDollarSign
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const PettyCash = () => {
  const navigate = useNavigate();
  const [pettyCashUsers, setPettyCashUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIssueCashModal, setShowIssueCashModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state for creating/editing petty cash users
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    initial_balance: 0,
    monthly_limit: 1000,
    status: 'active'
  });

  // Form state for cash issuance
  const [issuanceForm, setIssuanceForm] = useState({
    amount: '',
    description: 'Cash replenishment',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchPettyCashUsers();
  }, []);

  const fetchPettyCashUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/petty-cash-admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const usersData = response.data?.users || response.data || [];
      setPettyCashUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching petty cash users:', error);
      toast.error('Failed to fetch petty cash users');
      setPettyCashUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate random 6-digit employee ID
  const generateEmployeeId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Generate random department
  const generateDepartment = () => {
    const departments = ['Finance', 'HR', 'IT', 'Operations', 'Marketing', 'Sales', 'Admin', 'Maintenance'];
    return departments[Math.floor(Math.random() * departments.length)];
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Add random employee ID to the form data
      const userData = {
        ...userForm,
        employee_id: generateEmployeeId(),
        department: generateDepartment(),
        boarding_house_id: localStorage.getItem('boarding_house_id')
      };
      
      await axios.post(`${BASE_URL}/petty-cash-admin/register`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Petty cash user created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchPettyCashUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create petty cash user';
      toast.error(errorMessage);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Add employee ID if not present (for existing users)
      const userData = {
        ...userForm,
        employee_id: userForm.employee_id || generateEmployeeId(),
        department: userForm.department || generateDepartment()
      };
      
      await axios.put(`${BASE_URL}/petty-cash-admin/users/${selectedUser.id}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Petty cash user updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchPettyCashUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update petty cash user';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this petty cash user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${BASE_URL}/petty-cash-admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Petty cash user deleted successfully');
      fetchPettyCashUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete petty cash user';
      toast.error(errorMessage);
    }
  };

  const handleIssueCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const issuanceData = {
        amount: parseFloat(issuanceForm.amount),
        purpose: issuanceForm.description,
        reference_number: issuanceForm.reference_number,
        notes: issuanceForm.notes
      };
      
      // Create replenishment transaction for the selected user
      await axios.post(`${BASE_URL}/petty-cash-admin/users/${selectedUser.id}/issue-cash`, issuanceData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Cash issued successfully');
      setShowIssueCashModal(false);
      resetIssuanceForm();
      fetchPettyCashUsers();
    } catch (error) {
      console.error('Error issuing cash:', error);
      const errorMessage = error.response?.data?.message || 'Failed to issue cash';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setUserForm({
      username: '',
      full_name: '',
      email: '',
      password: '',
      department: '',
      phone: '',
      initial_balance: 0,
      monthly_limit: 1000,
      status: 'active'
    });
    setSelectedUser(null);
  };

  const resetIssuanceForm = () => {
    setIssuanceForm({
      amount: '',
      description: 'Cash replenishment',
      reference_number: '',
      notes: ''
    });
  };

  const openIssueCashModal = (user) => {
    setSelectedUser(user);
    resetIssuanceForm();
    setShowIssueCashModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      password: '',
      department: user.department,
      phone: user.phone,
      initial_balance: user.current_balance || 0,
      monthly_limit: user.monthly_limit || 1000,
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'active'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Petty Cash Users</h1>
          <p className="text-xs text-gray-500">Manage petty cash user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 text-xs text-white transition-colors"
          style={{ backgroundColor: '#E78D69' }}
        >
          <FaPlus size={14} className="mr-2" />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
               <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                 <th className="px-6 py-3 text-left">Name</th>
                 <th className="px-6 py-3 text-right">Current Balance</th>
                 <th className="px-6 py-3 text-center">Status</th>
                 <th className="px-6 py-3 text-right">Actions</th>
               </tr>
             </thead>
            <tbody>
              {pettyCashUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-800">{user.full_name}</div>
                  </td>

                   <td className="px-6 py-4 text-right">
                    <div className="text-xs font-medium text-gray-800">
                      ${parseFloat(user.current_balance || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openIssueCashModal(user)}
                        className="text-xs text-orange-600 hover:text-orange-800 px-2 py-1"
                        title="Issue Cash"
                      >
                        <FaDollarSign size={12} />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/petty-cash/reconciliation/${user.id}`)}
                        className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1"
                        title="View Reconciliation"
                      >
                        <FaFileAlt size={12} />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                        title="Edit User"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/petty-cash/user/${user.id}`)}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1"
                        title="View Details"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                        title="Delete User"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pettyCashUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-xs text-gray-500 mb-4">No petty cash users found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-white px-4 py-2 transition-colors"
              style={{ backgroundColor: '#E78D69' }}
            >
              Create Your First User
            </button>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Create Petty Cash User</h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.initial_balance}
                    onChange={(e) => setUserForm({...userForm, initial_balance: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.monthly_limit}
                    onChange={(e) => setUserForm({...userForm, monthly_limit: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1000.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white transition-colors"
                  style={{ backgroundColor: '#E78D69' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Edit Petty Cash User</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                   <input
                     type="text"
                     value={userForm.department}
                     onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                     className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                     placeholder="Enter department"
                   />
                 </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.initial_balance}
                    onChange={(e) => setUserForm({...userForm, initial_balance: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.monthly_limit}
                    onChange={(e) => setUserForm({...userForm, monthly_limit: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1000.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                    className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white transition-colors"
                  style={{ backgroundColor: '#E78D69' }}
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Cash Modal */}
      {showIssueCashModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Issue Cash to {selectedUser.full_name}
              </h2>
              <button 
                onClick={() => {
                  setShowIssueCashModal(false);
                  resetIssuanceForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Current Balance</div>
              <div className="text-lg font-semibold text-gray-800">
                ${parseFloat(selectedUser.current_balance || 0).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleIssueCash} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount*</label>
                <input
                  type="number"
                  step="0.01"
                  value={issuanceForm.amount}
                  onChange={(e) => setIssuanceForm({...issuanceForm, amount: e.target.value})}
                  className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description*</label>
                <input
                  type="text"
                  value={issuanceForm.description}
                  onChange={(e) => setIssuanceForm({...issuanceForm, description: e.target.value})}
                  className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Cash replenishment"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={issuanceForm.reference_number}
                  onChange={(e) => setIssuanceForm({...issuanceForm, reference_number: e.target.value})}
                  className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional reference number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={issuanceForm.notes}
                  onChange={(e) => setIssuanceForm({...issuanceForm, notes: e.target.value})}
                  className="w-full text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Additional notes (optional)"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueCashModal(false);
                    resetIssuanceForm();
                  }}
                  className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white transition-colors"
                  style={{ backgroundColor: '#E78D69' }}
                >
                  Issue Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Cash Modal */}
      {showIssueCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Issue Cash to {selectedUser?.full_name || selectedUser?.username}</h2>
            <form onSubmit={handleIssueCash}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={issuanceForm.amount}
                    onChange={(e) => setIssuanceForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={issuanceForm.description}
                    onChange={(e) => setIssuanceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cash replenishment"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={issuanceForm.reference_number}
                    onChange={(e) => setIssuanceForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={issuanceForm.notes}
                    onChange={(e) => setIssuanceForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowIssueCashModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Issue Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCash;