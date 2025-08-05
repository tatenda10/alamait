import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UsersIcon, 
  KeyIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  ChartBarIcon,
  BellIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BASE_URL from '../utils/api';

const Dashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="min-h-screen mt-8 bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen mt-8 bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-sm text-white bg-gray-600 hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { primaryStats, secondaryStats, charts } = dashboardData || {};

  return (
    <div className="min-h-screen mt-10 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="text-xs border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="relative p-1.5 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-gray-600 flex items-center justify-center text-[10px] text-white">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-1 py-4">
        {/* Primary Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {primaryStats?.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-3 border border-gray-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-gray-600 p-1.5">
                    {getIconForStat(stat.name)}
                  </div>
                </div>
                <div className="ml-2.5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-sm font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-1.5 flex items-baseline text-[10px] font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                    <dd className="text-[10px] text-gray-400 mt-0.5">
                      {stat.subtitle}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="mb-4">
          {/* Room Occupancy Trend */}
          <div className="bg-white border border-gray-200 p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Room Occupancy Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts?.occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[85, 95]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#4B5563" 
                  strokeWidth={1.5}
                  name="Occupancy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {secondaryStats?.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-3 border border-gray-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getIconForStat(stat.name)}
                </div>
                <div className="ml-2.5">
                  <div className="text-xs font-medium text-gray-500">{stat.name}</div>
                  <div className="flex items-baseline">
                    <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
                    <div className={`ml-1.5 text-[10px] font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {stat.change !== '0' && stat.change}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getIconForStat = (name) => {
  const iconClass = "h-4 w-4 text-white";
  switch (name) {
    case 'Total Students':
      return <UsersIcon className={iconClass} />;
    case 'Room Occupancy':
      return <BuildingOfficeIcon className={iconClass} />;
    case 'Monthly Revenue':
      return <CurrencyDollarIcon className={iconClass} />;
    case 'Available Rooms':
      return <KeyIcon className="h-4 w-4 text-gray-600" />;
    case 'Staff on Duty':
      return <UserGroupIcon className="h-4 w-4 text-gray-600" />;
    case 'Pending Payments':
      return <ClipboardDocumentListIcon className="h-4 w-4 text-gray-600" />;
    default:
      return <ChartBarIcon className="h-4 w-4 text-gray-600" />;
  }
};

export default Dashboard;