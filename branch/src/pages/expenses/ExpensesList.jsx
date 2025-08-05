import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../../utils/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ExpensesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editForm, setEditForm] = useState({
    expense_date: '',
    amount: '',
    description: '',
    payment_method: 'cash',
    reference_number: '',
    expense_account_id: '',
    notes: '',
    boarding_house_id: localStorage.getItem('boarding_house_id')
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchExpenses();
    fetchExpenseAccounts();
  }, [currentPage]);

  // Add debounce to search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchExpenses();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/expenses/boarding-house`, {
        headers: getAuthHeaders(),
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          boarding_house_id: localStorage.getItem('boarding_house_id')
        }
      });
      setExpenses(response.data.expenses);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchExpenseAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/coa`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'boarding-house-id': localStorage.getItem('boarding_house_id')
        }
      });
      // Filter only expense accounts
      const expenseAccts = response.data.data.filter(account => account.type === 'Expense');
      setExpenseAccounts(expenseAccts);
    } catch (error) {
      console.error('Error fetching expense accounts:', error);
      setError('Failed to load expense accounts');
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditForm({
      expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
      amount: expense.amount,
      description: expense.description,
      payment_method: expense.payment_method,
      reference_number: expense.reference_number || '',
      expense_account_id: expense.expense_account_id,
      notes: expense.notes || '',
      boarding_house_id: localStorage.getItem('boarding_house_id')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/expenses/${selectedExpense.id}`, editForm, {
        headers: getAuthHeaders()
      });
      fetchExpenses();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/expenses/${selectedExpense.id}`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id')
        }
      });
      fetchExpenses();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/expenses`, editForm, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'boarding-house-id': localStorage.getItem('boarding_house_id')
        }
      });
      fetchExpenses();
      setIsAddModalOpen(false);
      setEditForm({
        expense_date: '',
        amount: '',
        description: '',
        payment_method: 'cash',
        reference_number: '',
        expense_account_id: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // Remove client-side filtering since we're using server-side search
  const handleViewReceipt = (receiptPath, receiptName) => {
    if (!receiptPath) return;
    
    // Construct the full URL to the receipt
    const receiptUrl = `${BASE_URL}/uploads/expense-receipts/${receiptPath}`;
    
    // Open receipt in a new tab
    window.open(receiptUrl, '_blank');
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={editForm.expense_date}
            onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            value={editForm.payment_method}
            onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Expense Account</label>
          <select
            value={editForm.expense_account_id}
            onChange={(e) => setEditForm({ ...editForm, expense_account_id: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            required
          >
            <option value="">Select an account</option>
            {expenseAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reference Number</label>
          <input
            type="text"
            value={editForm.reference_number}
            onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 text-sm focus:ring-[#E78D69] focus:border-[#E78D69]"
            rows={3}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsEditModalOpen(false);
            setIsAddModalOpen(false);
            setSelectedExpense(null);
            setEditForm({
              expense_date: '',
              amount: '',
              description: '',
              payment_method: 'cash',
              reference_number: '',
              expense_account_id: '',
              notes: ''
            });
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#E78D69] hover:bg-[#E78D69]/90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 mt-10">
      <h2 className="text-base font-medium text-gray-900">Expenses</h2>
      <p className="mt-1 text-sm text-gray-500">Manage and track all expenses</p>

      {/* Search Bar and Add Button */}
      <div className="mt-4 mb-6 flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#E78D69] focus:border-[#E78D69]"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/dashboard/expenses/add')}
          className="ml-4 inline-flex items-center px-2 py-1 text-sm font-medium text-white bg-[#E78D69] hover:bg-[#E78D69]/90"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="mt-6">
        <div className="border border-gray-200 rounded-lg">
          <div className="">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Description</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Account</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Method</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Amount</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Reference</th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{expense.description}</td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {expense.expense_account_code} - {expense.expense_account_name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        <span className="capitalize">{expense.payment_method.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        ${parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">{expense.reference_number}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsViewModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Expense"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Expense"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                        {searchTerm ? 'No expenses found matching your search' : 'No expenses found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between items-center">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedExpense && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Expense Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedExpense.expense_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="mt-1 text-sm text-gray-900">
                  ${parseFloat(selectedExpense.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedExpense.payment_method.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account</p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedExpense.expense_account_code} - {selectedExpense.expense_account_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reference Number</p>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.reference_number || '-'}</p>
              </div>
              {selectedExpense.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedExpense.notes}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Receipt</p>
                {selectedExpense.receipt_path ? (
                  <button
                    onClick={() => handleViewReceipt(selectedExpense.receipt_path, selectedExpense.receipt_original_name)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Receipt ({selectedExpense.receipt_original_name})
                  </button>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No receipt attached</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedExpense && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-4xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Expense</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {renderForm(handleUpdate, 'Save Changes')}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {/* Removed Add Modal */}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedExpense && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Expense</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesList; 