import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserIcon, PhoneIcon, MapPinIcon, TagIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const ViewSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [supplierExpenses, setSupplierExpenses] = useState([]);
  const [accountsPayable, setAccountsPayable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupplierData();
    fetchSupplierExpenses();
    fetchAccountsPayable();
  }, [id]);

  const fetchSupplierData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/suppliers/${id}`);
      setSupplier(response.data.data);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      setError('Failed to fetch supplier data');
    }
  };

  const fetchSupplierExpenses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/suppliers/${id}/expenses`);
      setSupplierExpenses(response.data || []);
    } catch (error) {
      console.error('Error fetching supplier expenses:', error);
      setSupplierExpenses([]);
    }
  };

  const fetchAccountsPayable = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/suppliers/${id}/accounts-payable`);
      setAccountsPayable(response.data || []);
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      setAccountsPayable([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalBalance = () => {
    return accountsPayable.reduce((total, item) => total + (item.balance || 0), 0);
  };

  const getTotalExpenses = () => {
    return supplierExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin border-4 border-blue-500 border-t-transparent w-8 h-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {supplier?.company || 'Supplier Details'}
        </h1>
      </div>

      {/* Supplier Information Card */}
      {supplier && (
        <div className="bg-white border border-gray-200 p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Supplier Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Contact Person</p>
                <p className="text-sm font-medium">{supplier.contact_person || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{supplier.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium">{supplier.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium">{supplier.category || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 mr-2 rounded-full ${supplier.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium capitalize">{supplier.status || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Balance Owed</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(getTotalBalance())}</p>
            </div>
            <CurrencyDollarIcon className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(getTotalExpenses())}</p>
            </div>
            <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Accounts Payable Section */}
      <div className="bg-white border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Outstanding Balance</h2>
        {accountsPayable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Invoice #</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Balance</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accountsPayable.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm">{item.invoice_number || 'N/A'}</td>
                    <td className="py-2 px-3 text-sm">{formatDate(item.date)}</td>
                    <td className="py-2 px-3 text-sm">{formatDate(item.due_date)}</td>
                    <td className="py-2 px-3 text-sm">{formatCurrency(item.amount)}</td>
                    <td className="py-2 px-3 text-sm font-medium">{formatCurrency(item.balance)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'paid' ? 'bg-green-100 text-green-800' :
                        item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 text-sm">No outstanding balance found for this supplier.</p>
        )}
      </div>

      {/* Supplier Expenses Section */}
      <div className="bg-white border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Expenses</h2>
        {supplierExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Payment Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierExpenses.map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm">{formatDate(expense.date)}</td>
                    <td className="py-2 px-3 text-sm">{expense.description || 'N/A'}</td>
                    <td className="py-2 px-3 text-sm">{expense.category || 'N/A'}</td>
                    <td className="py-2 px-3 text-sm font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="py-2 px-3 text-sm">{expense.payment_method || 'N/A'}</td>
                    <td className="py-2 px-3 text-sm">{expense.reference_number || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 text-sm">No expenses found for this supplier.</p>
        )}
      </div>
    </div>
  );
};

export default ViewSupplier;