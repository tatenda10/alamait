import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../context/Api';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  BanknotesIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      cash: 0,
      cbzBank: 0,
      cbzVault: 0,
      totalPettyCash: 0,
    },
    summary: {
      totalBoardingHouses: 0,
      totalRooms: 0,
      totalStudents: 0,
      averageOccupancyRate: 0,
      totalMonthlyRevenue: 0,
      totalMonthlyExpenses: 0,
      totalMonthlyProfit: 0,
      pendingPayments: 0,
      overduePayments: 0,
    },
    houses: [],
    monthlyMetrics: [],
    consolidatedMonthlyData: [],
    expenseCategories: [],
    activities: [],
    pettyCash: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch all dashboard data in parallel
      const [
        dashboardRes, 
        kpisRes, 
        pettyCashRes, 
        activitiesRes,
        consolidatedMonthlyRes,
        expenseCategoriesRes
      ] = await Promise.all([
        axios.get(`${BASE_URL}/dashboard/data`, { headers }).catch(err => {
          console.error('Error fetching dashboard data:', err);
          return { data: { summary: {}, houses: [], monthlyMetrics: [] } };
        }),
        axios.get(`${BASE_URL}/dashboard/kpis`, { headers }).catch(err => {
          console.error('Error fetching KPIs:', err);
          return { data: { cash: 0, cbzBank: 0, cbzVault: 0, totalPettyCash: 0 } };
        }),
        axios.get(`${BASE_URL}/dashboard/petty-cash-balances`, { headers }).catch(err => {
          console.error('Error fetching petty cash:', err);
          return { data: {} };
        }),
        axios.get(`${BASE_URL}/dashboard/activities`, { headers }).catch(err => {
          console.error('Error fetching activities:', err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/dashboard/consolidated-monthly-revenue-expenses`, { headers }).catch(err => {
          console.error('Error fetching consolidated monthly data:', err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/dashboard/consolidated-expense-categories`, { headers }).catch(err => {
          console.error('Error fetching expense categories:', err);
          return { data: [] };
        }),
      ]);

      console.log('📊 Dashboard Data Received:', {
        kpis: kpisRes.data,
        summary: dashboardRes.data.summary,
      });

      // Calculate current month totals from consolidated data
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const currentMonthData = consolidatedMonthlyRes.data?.find(m => m.month === currentMonth) || { revenue: 0, expenses: 0, profit: 0 };
      
      setDashboardData({
        kpis: kpisRes.data || { cash: 0, cbzBank: 0, cbzVault: 0, totalPettyCash: 0 },
        summary: {
          ...(dashboardRes.data.summary || {}),
          totalMonthlyExpenses: Math.round(currentMonthData.expenses || 0),
          totalMonthlyProfit: Math.round(currentMonthData.profit || 0),
        },
        houses: dashboardRes.data.houses || [],
        monthlyMetrics: dashboardRes.data.monthlyMetrics || [],
        consolidatedMonthlyData: consolidatedMonthlyRes.data || [],
        expenseCategories: expenseCategoriesRes.data || [],
        activities: activitiesRes.data || [],
        pettyCash: pettyCashRes.data || {},
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };


  // Prepare chart data - use consolidated monthly data if available, otherwise use monthlyMetrics
  const revenueExpenseData = (dashboardData.consolidatedMonthlyData.length > 0 
    ? dashboardData.consolidatedMonthlyData 
    : dashboardData.monthlyMetrics.map((metric) => ({
        month: metric.month,
        revenue: metric.income || 0,
        expenses: metric.expenses || 0,
        profit: (metric.income || 0) - (metric.expenses || 0),
      }))
  ).map((metric) => ({
    month: metric.month,
    revenue: metric.revenue || metric.income || 0,
    expenses: metric.expenses || 0,
    profit: metric.profit || ((metric.revenue || metric.income || 0) - (metric.expenses || 0)),
  }));

  const branchRevenueData = dashboardData.houses.map((house) => ({
    name: house.name,
    revenue: house.monthly_revenue || 0,
  }));

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58020]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-xs text-gray-500">Welcome back, {user?.username || 'Boss'}</p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Total Students */}
          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Students</p>
                <p className="text-lg font-bold text-blue-600 mt-0.5">
                  {formatNumber(dashboardData.summary.totalStudents)}
                </p>
              </div>
              <UsersIcon className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          {/* Bed Occupancy Rate */}
          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Bed Occupancy Rate</p>
                <p className="text-lg font-bold text-purple-600 mt-0.5">
                  {dashboardData.summary.averageOccupancyRate || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatNumber(dashboardData.summary.totalOccupiedBeds || 0)} / {formatNumber(dashboardData.summary.totalBeds || 0)} beds
                </p>
              </div>
              <ChartBarIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Cash on Hand</p>
                <p className="text-base font-bold text-green-600 mt-0.5">
                  {formatCurrency(dashboardData.kpis.cash)}
                </p>
              </div>
              <BanknotesIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">CBZ Bank</p>
                <p className="text-base font-bold text-blue-600 mt-0.5">
                  {formatCurrency(dashboardData.kpis.cbzBank)}
                </p>
              </div>
              <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">CBZ Vault</p>
                <p className="text-base font-bold text-indigo-600 mt-0.5">
                  {formatCurrency(dashboardData.kpis.cbzVault)}
                </p>
              </div>
              <BuildingOfficeIcon className="h-5 w-5 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Petty Cash</p>
                <p className="text-base font-bold text-purple-600 mt-0.5">
                  {formatCurrency(dashboardData.kpis.totalPettyCash)}
                </p>
              </div>
              <WalletIcon className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Financial Overview - Revenue, Expenses, Profit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <p className="text-xs font-medium text-gray-600">Monthly Revenue</p>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Current Month</span>
                </div>
                <p className="text-base font-bold text-green-600 mt-0.5">
                  {formatCurrency(dashboardData.summary.totalMonthlyRevenue || 0)}
                </p>
              </div>
              <ArrowUpCircleIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <p className="text-xs font-medium text-gray-600">Monthly Expenses</p>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Current Month</span>
                </div>
                <p className="text-base font-bold text-red-600 mt-0.5">
                  {formatCurrency(dashboardData.summary.totalMonthlyExpenses || 0)}
                </p>
              </div>
              <ArrowDownCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <p className="text-xs font-medium text-gray-600">Monthly Profit</p>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Current Month</span>
                </div>
                <p className={`text-base font-bold mt-0.5 ${
                  (dashboardData.summary.totalMonthlyProfit || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(dashboardData.summary.totalMonthlyProfit || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dashboardData.summary.totalMonthlyRevenue > 0 
                    ? `${Math.round(((dashboardData.summary.totalMonthlyProfit || 0) / dashboardData.summary.totalMonthlyRevenue) * 100)}% margin`
                    : '0% margin'
                  }
                </p>
              </div>
              <CurrencyDollarIcon className={`h-5 w-5 ${
                (dashboardData.summary.totalMonthlyProfit || 0) >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`} />
            </div>
          </div>
        </div>

        {/* Student Financials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Student Prepayments</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(dashboardData.summary.totalPrepayments || 0)}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Student Debtors (Total Owing)</p>
                <p className="text-base font-bold text-red-600 mt-0.5">
                  {formatCurrency(dashboardData.summary.totalDebtors || 0)}
                </p>
              </div>
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Monthly Revenue vs Expenses */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Profitability Trend */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Profitability Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Expense Categories Breakdown */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Expense Categories</h3>
            {dashboardData.expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-xs text-gray-500">No expense data available</p>
              </div>
            )}
          </div>

          {/* Branch Revenue Comparison */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Revenue by Branch</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={branchRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Performance Table */}
        <div className="bg-white border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Branch Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beds
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bed Occupancy
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.houses.map((house) => (
                  <tr key={house.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {house.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatNumber(house.students)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatNumber(house.occupied_beds || 0)} / {formatNumber(house.total_beds || 0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-semibold ${
                          house.occupancy >= 80
                            ? 'bg-green-100 text-green-800'
                            : house.occupancy >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {house.occupancy}%
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {formatCurrency(house.monthly_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Quick Stats */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-gray-50">
                <p className="text-lg font-bold text-gray-900">
                  {formatNumber(dashboardData.summary.totalBoardingHouses)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Boarding Houses</p>
              </div>
              <div className="text-center p-2 bg-gray-50">
                <p className="text-lg font-bold text-gray-900">
                  {formatNumber(dashboardData.summary.totalBeds || 0)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Total Beds</p>
              </div>
              <div className="text-center p-2 bg-gray-50">
                <p className="text-lg font-bold text-gray-900">
                  {formatNumber(dashboardData.summary.totalOccupiedBeds || 0)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Occupied Beds</p>
              </div>
              <div className="text-center p-2 bg-gray-50">
                <p className="text-lg font-bold text-gray-900">
                  {formatNumber((dashboardData.summary.totalBeds || 0) - (dashboardData.summary.totalOccupiedBeds || 0))}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Available Beds</p>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activities</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboardData.activities.length > 0 ? (
                dashboardData.activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-2 p-1.5 hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {activity.type === 'payment' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <UsersIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
