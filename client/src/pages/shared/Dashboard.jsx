import React, { useState, useEffect } from 'react';
import { 
  FaDollarSign, 
  FaFileInvoiceDollar, 
  FaCreditCard, 
  FaChartLine,
  FaBuilding,
  FaUsers,
  FaBed,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaChartPie,
  FaChartBar,
  FaTachometerAlt
} from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      cashPosition: 1732,
      accountsReceivable: 0,
      accountsPayable: 0,
      workingCapital: 0
    },
    pettyCash: {
      stKilda: 2716.08,
      belvedere: 727.00
    },
    roomOccupancy: {
      totalRooms: 0,
      availableRooms: 0,
      partiallyOccupiedRooms: 0,
      fullyOccupiedRooms: 0,
      totalBeds: 0,
      availableBeds: 0,
      occupiedBeds: 0,
      occupancyRate: 0
    },
    monthlyRevenue: [],
    invoiceStatus: [],
    expenseCategories: [],
    paymentMethods: [],
    boardingHouses: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch all dashboard data including room occupancy
      const [monthlyResponse, invoiceResponse, expensesResponse, paymentResponse, activitiesResponse, roomsResponse] = await Promise.all([
        axios.get(`${BASE_URL}/dashboard/monthly-revenue`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/invoice-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/expense-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/dashboard/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${BASE_URL}/rooms/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Calculate room occupancy data
      const rooms = roomsResponse.data || [];
      console.log('Rooms data from API:', rooms); // Debug log
      
      const roomOccupancy = {
        totalRooms: rooms.length,
        availableRooms: rooms.filter(room => room.status === 'Available').length,
        partiallyOccupiedRooms: rooms.filter(room => room.status === 'Partially Occupied').length,
        fullyOccupiedRooms: rooms.filter(room => room.status === 'Fully Occupied').length,
        totalBeds: rooms.reduce((sum, room) => sum + (room.bedInfo?.totalBeds || 0), 0),
        availableBeds: rooms.reduce((sum, room) => sum + (room.bedInfo?.availableBeds || 0), 0),
        occupiedBeds: rooms.reduce((sum, room) => sum + (room.bedInfo?.occupiedBeds || 0), 0),
        occupancyRate: 0
      };
      
      console.log('Calculated room occupancy:', roomOccupancy); // Debug log
      
      // Calculate occupancy rate
      if (roomOccupancy.totalBeds > 0) {
        roomOccupancy.occupancyRate = Math.round((roomOccupancy.occupiedBeds / roomOccupancy.totalBeds) * 100);
      }

      setDashboardData(prevData => ({
        ...prevData,
        // Keep static KPI data, update other data from API
        monthlyRevenue: monthlyResponse.data,
        invoiceStatus: invoiceResponse.data,
        expenseCategories: expensesResponse.data,
        paymentMethods: paymentResponse.data,
        recentActivities: activitiesResponse.data,
        roomOccupancy: roomOccupancy
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      // Set default room occupancy data on error
      setDashboardData(prevData => ({
        ...prevData,
        roomOccupancy: {
          totalRooms: 0,
          availableRooms: 0,
          partiallyOccupiedRooms: 0,
          fullyOccupiedRooms: 0,
          totalBeds: 0,
          availableBeds: 0,
          occupiedBeds: 0,
          occupancyRate: 0
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#f58020]"></div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaExclamationCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          </div>
        </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Financial Dashboard</h1>
          <p className="text-xs text-gray-600">Overview of your boarding house financial performance</p>
          </div>
    </div>

    {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Cash Position */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Cash Position</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(dashboardData.kpis?.cashPosition || 0)}</p>
      </div>
            <FaDollarSign className="h-8 w-8 text-green-500" />
          </div>
    </div>

        {/* Accounts Receivable */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Accounts Receivable</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardData.kpis?.accountsReceivable || 0)}</p>
      </div>
            <FaFileInvoiceDollar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        {/* Accounts Payable */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Accounts Payable</p>
              <p className="text-xl font-bold text-[#f58020]">{formatCurrency(dashboardData.kpis?.accountsPayable || 0)}</p>
          </div>
            <FaCreditCard className="h-8 w-8 text-[#f58020]" />
          </div>
        </div>
        
        {/* St Kilda Petty Cash */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">St Kilda Petty Cash</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(dashboardData.pettyCash?.stKilda || 0)}</p>
          </div>
            <FaBuilding className="h-8 w-8 text-purple-500" />
        </div>
      </div>
      
        {/* Belvedere Petty Cash */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Belvedere Petty Cash</p>
              <p className="text-xl font-bold text-indigo-600">{formatCurrency(dashboardData.pettyCash?.belvedere || 0)}</p>
        </div>
            <FaBuilding className="h-8 w-8 text-indigo-500" />
        </div>
      </div>
    </div>

      {/* Room Occupancy Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Room Occupancy Overview</h3>
          <div className="flex items-center space-x-2">
            <FaBed className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>
        
        {/* Room Occupancy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Rooms */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-700">{dashboardData.roomOccupancy?.totalRooms || 0}</p>
              </div>
              <FaBuilding className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Available Rooms */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Available Rooms</p>
                <p className="text-2xl font-bold text-green-700">{dashboardData.roomOccupancy?.availableRooms || 0}</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Partially Occupied */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 mb-1">Partially Occupied</p>
                <p className="text-2xl font-bold text-yellow-700">{dashboardData.roomOccupancy?.partiallyOccupiedRooms || 0}</p>
              </div>
              <FaExclamationCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          {/* Fully Occupied */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Fully Occupied</p>
                <p className="text-2xl font-bold text-red-700">{dashboardData.roomOccupancy?.fullyOccupiedRooms || 0}</p>
              </div>
              <FaUsers className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Bed Occupancy Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Beds */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Beds</p>
                <p className="text-xl font-bold text-gray-800">{dashboardData.roomOccupancy?.totalBeds || 0}</p>
              </div>
              <FaBed className="h-6 w-6 text-gray-500" />
            </div>
          </div>

          {/* Available Beds */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Available Beds</p>
                <p className="text-xl font-bold text-gray-800">{dashboardData.roomOccupancy?.availableBeds || 0}</p>
              </div>
              <FaCheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-xl font-bold text-gray-800">{dashboardData.roomOccupancy?.occupancyRate || 0}%</p>
              </div>
              <FaChartPie className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue vs Expenses - Full Width */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dashboardData.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
        </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expense Categories */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {dashboardData.expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.paymentMethods}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Bar dataKey="value" fill="#f58020" />
            </BarChart>
          </ResponsiveContainer>
      </div>
    </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {dashboardData.recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : activity.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-900">{activity.description}</span>
    </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 