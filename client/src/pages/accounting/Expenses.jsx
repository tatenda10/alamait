import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiFilter, FiDownload, FiX, FiPlus, FiEye, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Add ViewExpenseModal component
const ViewExpenseModal = ({ isOpen, onClose, expense, formatAmount }) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">View Expense Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <p className="text-sm text-gray-800">{new Date(expense.expense_date).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <p className="text-sm text-gray-800">{formatAmount(expense.amount)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reference Number</label>
            <p className="text-sm text-gray-800">{expense.reference_number || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
            <p className="text-sm text-gray-800 capitalize">{expense.payment_method?.replace('_', ' ') || '-'}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <p className="text-sm text-gray-800">{expense.description || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Account</label>
            <p className="text-sm text-gray-800">{expense.expense_account?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Boarding House</label>
            <p className="text-sm text-gray-800">{expense.boarding_house?.name || '-'}</p>
          </div>
          {expense.receipt_path && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Receipt</label>
              <a 
                href={`${BASE_URL}/uploads/${expense.receipt_path}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {expense.receipt_original_name || 'View Receipt'}
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



const Expenses = () => {
  const { token } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState(null);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewExpense, setViewExpense] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      console.log('Fetching expenses...');
      console.log('BASE_URL:', BASE_URL);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${BASE_URL}/expenses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Expenses response status:', response.status);
      console.log('Expenses response data:', response.data);
      console.log('Number of expenses found:', response.data?.data?.length || 0);
      
      if (response.data?.data) {
        setExpenses(response.data.data);
        console.log('Expenses set successfully:', response.data.data.length, 'items');
      } else {
        console.log('No data property in response');
        setExpenses([]);
      }
      setError('');
    } catch (error) {
      console.error('Error fetching expenses:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Failed to fetch expenses: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };



  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
      if (response.data.length > 0) {
        setSelectedBoardingHouse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExpenses();
      fetchBoardingHouses();
    }
  }, [token]);

  // Fetch data when boarding house changes
  useEffect(() => {
    if (token) {
      fetchExpenses();
    }
  }, [selectedBoardingHouse, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Format amount to USD
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesBoardingHouse = !selectedBoardingHouse || expense.boarding_house.id === selectedBoardingHouse;
    const matchesSearch = searchTerm === '' || 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_account?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesBoardingHouse && matchesSearch;
  });

  console.log('Filtered expenses:', filteredExpenses);

  // Handle view expense
  const handleViewExpense = (expense) => {
    setViewExpense(expense);
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    navigate(`/dashboard/expenses/edit/${expense.id}`);
  };

  // Handle add expense
  const handleAddExpense = () => {
    navigate('/dashboard/expenses/add');
  };



  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Expenses</h1>
            <p className="text-xs text-gray-500">Manage and track expenses across all boarding houses</p>
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span>More Options</span>
              <FiChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10">
                <button
                  onClick={() => {
                    navigate('/dashboard/expenses/accounts-payable');
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span>Accounts Payable</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Boarding House Selection */}
      {boardingHouses.length > 0 && (
        <div className="bg-white p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                {boardingHouses.find(bh => bh.id === selectedBoardingHouse)?.name || 'All Boarding Houses'}
              </h2>
            </div>
            <select
              className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedBoardingHouse || ''}
              onChange={(e) => setSelectedBoardingHouse(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Boarding Houses</option>
              {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>
                  {bh.name} - {bh.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}



      {/* Actions Bar */}
      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiDownload size={14} />
              <span>Export</span>
            </button>

            <button 
              onClick={handleAddExpense}
              className="flex items-center px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              <FiPlus size={14} className="mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Reference</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Account</th>
                <th className="px-6 py-3 text-left">Payment Method</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(expense.expense_date)}</td>
                    <td className="px-6 py-4">{expense.reference_number}</td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">{expense.expense_account?.name}</td>
                    <td className="px-6 py-4 capitalize">{expense.payment_method?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-right">{formatAmount(expense.amount)}</td>
                    <td className="px-6 py-4 text-right">{formatAmount((expense.total_paid || 0))}</td>
                    <td className="px-6 py-4 text-right">{formatAmount((expense.remaining_balance || expense.amount))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        expense.payment_status === 'full' 
                          ? 'bg-green-100 text-green-800' 
                          : expense.payment_status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.payment_status === 'full' ? 'Paid' : expense.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="View expense"
                        onClick={() => handleViewExpense(expense)}
                      >
                        <FiEye size={14} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit expense"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete expense"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Expense Modal */}
      <ViewExpenseModal
        isOpen={viewExpense !== null}
        onClose={() => setViewExpense(null)}
        expense={viewExpense}
        formatAmount={formatAmount}
      />
    </div>
  );
};

export default Expenses;
