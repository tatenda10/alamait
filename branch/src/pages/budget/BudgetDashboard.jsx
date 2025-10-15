import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BASE_URL from '../../utils/api';
import toast from 'react-hot-toast';

const BudgetDashboard = () => {
  const [budgetStats, setBudgetStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalBudgetAmount: 0
  });
  
  const [expenditureStats, setExpenditureStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalExpenditureAmount: 0
  });
  
  const [recentBudgetRequests, setRecentBudgetRequests] = useState([]);
  const [recentExpenditureRequests, setRecentExpenditureRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const boardingHouseId = localStorage.getItem('boarding_house_id');
      
      // Fetch budget requests
      const budgetUrl = boardingHouseId 
        ? `${BASE_URL}/budget-requests?boarding_house_id=${boardingHouseId}`
        : `${BASE_URL}/budget-requests`;
      
      const budgetResponse = await axios.get(budgetUrl, getAuthHeaders());
      const budgetRequests = budgetResponse.data;
      const budgetStats = calculateBudgetStats(budgetRequests);
      setBudgetStats(budgetStats);
      setRecentBudgetRequests(budgetRequests.slice(0, 5));

      // Fetch expenditure requests
      const expenditureUrl = boardingHouseId 
        ? `${BASE_URL}/expenditure-requests?boarding_house_id=${boardingHouseId}`
        : `${BASE_URL}/expenditure-requests`;
      
      const expenditureResponse = await axios.get(expenditureUrl, getAuthHeaders());
      const expenditureRequests = expenditureResponse.data;
      const expenditureStats = calculateExpenditureStats(expenditureRequests);
      setExpenditureStats(expenditureStats);
      setRecentExpenditureRequests(expenditureRequests.slice(0, 5));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetStats = (requests) => {
    const stats = {
      totalRequests: requests.length,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalBudgetAmount: 0
    };

    requests.forEach(request => {
      stats[`${request.status}Requests`]++;
      if (request.status === 'approved') {
        stats.totalBudgetAmount += request.totalAmount || 0;
      }
    });

    return stats;
  };

  const calculateExpenditureStats = (requests) => {
    const stats = {
      totalRequests: requests.length,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalExpenditureAmount: 0
    };

    requests.forEach(request => {
      stats[`${request.status}Requests`]++;
      if (request.status === 'approved') {
        stats.totalExpenditureAmount += request.amount || 0;
      }
    });

    return stats;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 mt-8 sm:px-4 lg:px-6 py-4">
      <div className="sm:flex sm:items-center pb-3 border-b border-gray-200">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Budget Dashboard</h2>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Overview of budget requests and expenditure management
          </p>
        </div>
      </div>

      {/* Budget Statistics */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Budget Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-[#E78D69]/10">
                <DocumentTextIcon className="h-5 w-5 text-[#E78D69]" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                <p className="text-lg font-semibold text-gray-900">{budgetStats.totalRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">{budgetStats.pendingRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-semibold text-gray-900">{budgetStats.approvedRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Rejected</p>
                <p className="text-lg font-semibold text-gray-900">{budgetStats.rejectedRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Budget</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${budgetStats.totalBudgetAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenditure Statistics */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Expenditure Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100">
                <DocumentTextIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                <p className="text-lg font-semibold text-gray-900">{expenditureStats.totalRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">{expenditureStats.pendingRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-semibold text-gray-900">{expenditureStats.approvedRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Rejected</p>
                <p className="text-lg font-semibold text-gray-900">{expenditureStats.rejectedRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100">
                <CurrencyDollarIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Expenditure</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${expenditureStats.totalExpenditureAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Budget Requests */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Recent Budget Requests</h4>
            </div>
            <div className="p-4">
              {recentBudgetRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentBudgetRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <div className="ml-3">
                          <p className="text-xs font-medium text-gray-900">
                            {request.month} {request.year}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${request.totalAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-xs">No recent budget requests</p>
              )}
          </div>
        </div>

          {/* Recent Expenditure Requests */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Recent Expenditure Requests</h4>
            </div>
            <div className="p-4">
              {recentExpenditureRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentExpenditureRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <div className="ml-3">
                          <p className="text-xs font-medium text-gray-900">
                            {request.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${request.amount?.toLocaleString()} • {request.category}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-xs">No recent expenditure requests</p>
              )}
            </div>
          </div>
      </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
