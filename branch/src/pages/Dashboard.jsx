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
  ShieldCheckIcon,
  CreditCardIcon,
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BASE_URL from '../utils/api';

const Dashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);
  const [pettyCashTransactions, setPettyCashTransactions] = useState([]);
  const [bedOccupancy, setBedOccupancy] = useState(null);

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'boarding-house-id': localStorage.getItem('boarding_house_id')
    }
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch main dashboard stats
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/stats`, getAuthHeaders());
      setDashboardData(dashboardResponse.data);

      // Fetch user's petty cash account balance and transactions
      try {
        const pettyCashResponse = await axios.get(`${BASE_URL}/petty-cash/account`, getAuthHeaders());
        if (pettyCashResponse.data && pettyCashResponse.data.success) {
          setAccountBalance({
            current_balance: pettyCashResponse.data.current_balance,
            account_name: pettyCashResponse.data.account_name,
            account_code: pettyCashResponse.data.account_code
          });
          setPettyCashTransactions(pettyCashResponse.data.transactions || []);
        }
      } catch (pettyCashError) {
        console.error('Error fetching petty cash account:', pettyCashError);
        setAccountBalance(null);
        setPettyCashTransactions([]);
      }

      // Fetch bed occupancy
      try {
        const roomsResponse = await axios.get(`${BASE_URL}/rooms`, getAuthHeaders());
        if (roomsResponse.data && Array.isArray(roomsResponse.data)) {
          const rooms = roomsResponse.data;
          
          // Fetch beds for all rooms
          const bedsPromises = rooms.map(async (room) => {
            try {
              const bedsResponse = await axios.get(`${BASE_URL}/beds/room/${room.id}`, getAuthHeaders());
              return bedsResponse.data || [];
            } catch (err) {
              console.error(`Error fetching beds for room ${room.id}:`, err);
              return [];
            }
          });
          
          const bedsResults = await Promise.all(bedsPromises);
          const allBeds = bedsResults.flat();
          
          // Filter out deleted beds
          const activeBeds = allBeds.filter(bed => !bed.deleted_at);
          const totalBeds = activeBeds.length;
          const occupiedBeds = activeBeds.filter(bed => bed.status === 'occupied').length;
          const availableBeds = activeBeds.filter(bed => bed.status === 'available').length;
          const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;
          
          setBedOccupancy({
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyRate: parseFloat(occupancyRate)
          });
        }
      } catch (bedError) {
        console.error('Error fetching bed occupancy:', bedError);
        setBedOccupancy(null);
      }

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

      <div className="px-2 sm:px-4 lg:px-6 py-4">
        {/* Petty Cash Account Balance Card - Full Width */}
        {accountBalance && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <WalletIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-blue-900">Petty Cash Balance</h3>
                    <p className="text-xs text-blue-600 truncate">{accountBalance.account_name}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className={`text-lg sm:text-xl font-bold ${
                    parseFloat(accountBalance.current_balance) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${parseFloat(accountBalance.current_balance || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-blue-600">Current Balance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bed Occupancy Card */}
        {bedOccupancy && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <HomeIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-green-900">Bed Occupancy</h3>
                    <p className="text-xs text-green-600">{bedOccupancy.occupiedBeds} of {bedOccupancy.totalBeds} beds occupied</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg sm:text-xl font-bold text-green-900">
                    {bedOccupancy.occupancyRate}%
                  </div>
                  <p className="text-xs text-green-600">Occupancy Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Recent Petty Cash Transactions */}
        <div className="mb-4">
          <div className="bg-white border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <WalletIcon className="h-4 w-4 mr-2 text-gray-600" />
                Recent Petty Cash Transactions
              </h3>
              <a 
                href="/dashboard/petty-cash" 
                className="text-xs text-[#E78D69] hover:text-[#E78D69]/80"
              >
                View All
              </a>
            </div>
            {pettyCashTransactions.length > 0 ? (
              <div className="space-y-2">
                {pettyCashTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`p-1 rounded-full ${
                        transaction.transaction_type === 'expense' 
                          ? 'bg-red-100' 
                          : 'bg-green-100'
                      }`}>
                        {transaction.transaction_type === 'expense' ? (
                          <ArrowDownIcon className="h-3 w-3 text-red-600" />
                        ) : (
                          <ArrowUpIcon className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{transaction.description}</p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${
                        transaction.transaction_type === 'expense' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}${parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Balance: ${parseFloat(transaction.running_balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <WalletIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">No petty cash transactions found</p>
                <p className="text-[10px] text-gray-400 mt-1">Transactions will appear here once you start using petty cash</p>
              </div>
            )}
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
    case 'Bed Occupancy':
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