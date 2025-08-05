import React from 'react';
import { FaBell, FaChevronDown, FaUserCircle, FaBuilding, FaUsers, FaBed, FaMoneyBillWave, FaCheckCircle, FaExclamationCircle, FaPlus, FaExchangeAlt, FaSearch, FaCog, FaFileImport, FaChartBar, FaCalendarAlt, FaInfo, FaChartPie, FaHome } from 'react-icons/fa';

const kpis = [
  { label: 'Total Boarding Houses', value: 3, icon: <FaHome className="text-purple-600" /> },
  { label: 'Total Rooms', value: 103, icon: <FaBed className="text-indigo-600" /> },
  { label: 'Total Students Enrolled', value: 1240, icon: <FaUsers className="text-green-600" /> },
  { label: 'Average Occupancy Rate', value: '85%', icon: <FaChartPie className="text-blue-700" /> },
  { label: 'Active Rooms', value: 320, icon: <FaBed className="text-teal-600" /> },
  { label: 'Available Rooms', value: 45, icon: <FaBed className="text-orange-600" /> },
];

const houses = [
  { name: 'Belvedere House', admin: 'Jane M.', students: 120, rooms: 35, occupancy: 86, last: '2 hours ago' },
  { name: 'St Claire House', admin: 'Peter K.', students: 98, rooms: 28, occupancy: 78, last: '1 hour ago' },
  { name: 'Eden Boarding', admin: 'Sarah T.', students: 150, rooms: 40, occupancy: 92, last: '10 min ago' },
];

const activities = [
  'Student enrolled at Sunrise House',
  'Transaction posted at Eden Boarding',
  'Audit log: Admin deleted room #201 in Greenhill',
];

const exchangeRates = [
  { currency: 'USD', rate: 1, updated: 'Now' },
  { currency: 'ZWL', rate: 9000, updated: 'Today' },
  { currency: 'EUR', rate: 0.92, updated: 'Yesterday' },
];

const quickActions = [
  { label: 'Create New Tenant', icon: <FaPlus />, color: 'bg-blue-100 text-blue-700' },
  { label: 'Post Global Transaction', icon: <FaExchangeAlt />, color: 'bg-green-100 text-green-700' },
  { label: 'Run Consolidated Report', icon: <FaSearch />, color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Manage User Roles', icon: <FaCog />, color: 'bg-gray-100 text-gray-700' },
  { label: 'Import Chart of Accounts', icon: <FaFileImport />, color: 'bg-orange-100 text-orange-700' },
];

const insights = [
  { type: 'warning', text: 'Low occupancy alert: Sunrise House below 80%' },
  { type: 'danger', text: 'Delinquent: 3 accounts 30+ days unpaid' },
  { type: 'info', text: 'Audit flag: Large adjustment posted in Eden Boarding' },
];

const reminders = [
  { date: '2024-06-21', text: 'Upcoming student exits' },
  { date: '2024-06-25', text: 'Lease expiries' },
  { date: '2024-06-30', text: 'Monthly reporting due' },
];

const monthlyMetrics = [
  {
    house: 'Belvedere House',
    months: [
      { month: 'Apr', income: 45000, expenses: 32000 },
      { month: 'May', income: 48000, expenses: 35000 },
      { month: 'Jun', income: 52000, expenses: 38000 }
    ]
  },
  {
    house: 'St Claire House',
    months: [
      { month: 'Apr', income: 38000, expenses: 28000 },
      { month: 'May', income: 42000, expenses: 31000 },
      { month: 'Jun', income: 45000, expenses: 33000 }
    ]
  }
];

const Dashboard = () => (
  <div className="space-y-4">
    {/* Header Section */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Removed welcome message and date/time */}
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-6 gap-2">
      {kpis.map((k, i) => (
        <div key={i} className="bg-white rounded-sm border border-gray-200 p-3 flex items-center text-start">
          <div className="text-xl mr-2">{k.icon}</div>
          <div className="flex flex-col">
            <div className="text-xl font-bold text-gray-800">{k.value}</div>
            <div className="text-xs text-gray-500">{k.label}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Three Month Metrics */}
    <div className="bg-white rounded-md  p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-gray-700">Three Month Financial Overview</h2>
       
      </div>
      
      <div className="flex items-end space-x-8 h-64">
        {/* Belvedere House - April */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[0].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[0].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[0].months[0].income - monthlyMetrics[0].months[0].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Belvedere Apr</div>
        </div>
        
        {/* Belvedere House - May */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[1].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[1].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[0].months[1].income - monthlyMetrics[0].months[1].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Belvedere May</div>
        </div>
        
        {/* Belvedere House - June */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[2].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[0].months[2].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[0].months[2].income - monthlyMetrics[0].months[2].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Belvedere Jun</div>
        </div>
        
        {/* St Claire House - April */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[0].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[0].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[1].months[0].income - monthlyMetrics[1].months[0].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">St Claire Apr</div>
        </div>
        
        {/* St Claire House - May */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[1].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[1].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[1].months[1].income - monthlyMetrics[1].months[1].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">St Claire May</div>
        </div>
        
        {/* St Claire House - June */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end space-x-1 w-full">
            <div 
              className="bg-gray-700 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[2].income / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-400 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max((monthlyMetrics[1].months[2].expenses / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
            <div 
              className="bg-gray-300 rounded-t-sm min-h-[4px]" 
              style={{ height: `${Math.max(((monthlyMetrics[1].months[2].income - monthlyMetrics[1].months[2].expenses) / 60000) * 256, 4)}px`, width: '30%' }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">St Claire Jun</div>
        </div>
      </div>
      
      <div className="flex space-x-4 text-xs mt-4 justify-end">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-700 rounded mr-1"></div>
          <span>Income</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
          <span>Expenses</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded mr-1"></div>
          <span>Profit</span>
        </div>
      </div>
    </div>

    {/* Main Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Boarding House Summary */}
      <div className="col-span-2 bg-white rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700">Boarding House Summary</h2>
          <button className="text-gray-400 hover:text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-700 border-b">
                <th className="py-2 px-2 text-left">House Name</th>
                <th className="py-2 px-2 text-left">Admin</th>
                <th className="py-2 px-2 text-center">Students</th>
                <th className="py-2 px-2 text-center">Rooms</th>
                <th className="py-2 px-2 text-center">Occupancy %</th>
                <th className="py-2 px-2 text-center">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((h, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 font-semibold text-blue-900">{h.name}</td>
                  <td className="py-2 px-2">{h.admin}</td>
                  <td className="py-2 px-2 text-center">{h.students}</td>
                  <td className="py-2 px-2 text-center">{h.rooms}</td>
                  <td className="py-2 px-2 text-center">{h.occupancy}%</td>
                  <td className="py-2 px-2 text-center">{h.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Calendar */}
      <div className="bg-white rounded-md p-6 flex flex-col items-start">
        <h2 className="text-lg font-bold text-blue-900 mb-2 text-left w-full">Calendar</h2>
        <CalendarWithNotifications />
      </div>
    </div>

    {/* Lower Grid */}


  

    {/* Recent Income Statement */}
    <div className="bg-white rounded-md p-6 mt-6">
      <h2 className="text-sm font-bold text-gray-700 mb-4 text-left">Income Statement – {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <table className="w-full text-sm">
        <tbody>
          {/* Income Section */}
          <tr>
            <td className="py-1 px-2 font-semibold text-gray-700 text-left">Income</td>
            <td className="py-1 px-2 text-right"></td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">St Claire Boarding Fees</td>
            <td className="py-1 px-2 text-right">$12,000</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Belvedere Boarding Fees</td>
            <td className="py-1 px-2 text-right">$15,000</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Other Income</td>
            <td className="py-1 px-2 text-right">$2,000</td>
          </tr>
          <tr>
            <td className="py-1 px-2 font-semibold text-gray-900 text-left">Total Income</td>
            <td className="py-1 px-2 text-right font-semibold">$29,000</td>
          </tr>
          {/* Operating Expenses Section */}
          <tr><td className="py-2"></td><td className="py-2"></td></tr>
          <tr>
            <td className="py-1 px-2 font-semibold text-gray-700 text-left">Operating Expenses</td>
            <td className="py-1 px-2 text-right"></td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Rent</td>
            <td className="py-1 px-2 text-right">($3,000)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Water</td>
            <td className="py-1 px-2 text-right">($800)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Electricity</td>
            <td className="py-1 px-2 text-right">($1,100)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Security Services</td>
            <td className="py-1 px-2 text-right">($900)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Repairs & Maintenance</td>
            <td className="py-1 px-2 text-right">($600)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Salaries</td>
            <td className="py-1 px-2 text-right">($1,000)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Cleaning Supplies</td>
            <td className="py-1 px-2 text-right">($400)</td>
          </tr>
          {/* Non-Operating Expenses Section */}
          <tr><td className="py-2"></td><td className="py-2"></td></tr>
          <tr>
            <td className="py-1 px-2 font-semibold text-gray-700 text-left">Non-Operating Expenses</td>
            <td className="py-1 px-2 text-right"></td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Exchange Rate Loss</td>
            <td className="py-1 px-2 text-right">($500)</td>
          </tr>
          <tr>
            <td className="py-1 px-2 text-gray-700 text-left">Interest Expense</td>
            <td className="py-1 px-2 text-right">($300)</td>
          </tr>
          {/* Total Expenses */}
          <tr>
            <td className="py-1 px-2 font-semibold text-gray-900 text-left">Total Expenses</td>
            <td className="py-1 px-2 text-right font-semibold">($7,600)</td>
          </tr>
          {/* Net Profit Section */}
          <tr><td className="py-2"></td><td className="py-2"></td></tr>
          <tr className="font-bold">
            <td className="py-2 px-2 text-gray-900 border-b-4 border-t-2 border-gray-900 text-left" style={{borderBottomWidth:'4px',borderTopWidth:'2px'}}>Net Profit</td>
            <td className="py-2 px-2 text-right text-green-700 border-b-4 border-t-2 border-gray-900" style={{borderBottomWidth:'4px',borderTopWidth:'2px'}}>$21,400</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

function CalendarWithNotifications() {
  // Simple calendar for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Example: circle 5th, 12th, 18th, 25th
  const notificationDays = [5, 12, 18, 25];
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700">{today.toLocaleString('default', { month: 'long' })} {year}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="font-semibold text-gray-400">{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className="h-7 flex items-center justify-center">
            {d ? (
              <span className={`inline-block w-6 h-6 rounded-full ${notificationDays.includes(d) ? 'border-2 border-red-500 text-red-600 font-bold' : 'text-gray-700'} ${d === today.getDate() ? 'bg-gray-200' : ''}`}>{d}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard; 