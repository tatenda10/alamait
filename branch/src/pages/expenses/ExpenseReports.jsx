import React, { useState } from 'react';
import { FaFileDownload, FaChartPie, FaChartBar } from 'react-icons/fa';

const ExpenseReports = () => {
  const [dateRange, setDateRange] = useState('monthly');
  const [reportType, setReportType] = useState('summary');

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Expense Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate and analyze expense reports
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
              >
                <option value="weekly">Last Week</option>
                <option value="monthly">Last Month</option>
                <option value="quarterly">Last Quarter</option>
                <option value="yearly">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
              >
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Report</option>
                <option value="category">Category Analysis</option>
                <option value="trend">Trend Analysis</option>
              </select>
            </div>

            <button
              className="w-full flex justify-center items-center px-4 py-2 text-xs text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
            >
              <FaFileDownload className="h-3 w-3 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FaChartPie className="h-4 w-4 text-[#E78D69] mr-2" />
                <p className="text-sm text-gray-600">Total Expenses</p>
              </div>
              <p className="text-xl font-semibold text-gray-900 mt-2">$45,250.00</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FaChartBar className="h-4 w-4 text-[#E78D69] mr-2" />
                <p className="text-sm text-gray-600">Avg. Daily Expense</p>
              </div>
              <p className="text-xl font-semibold text-gray-900 mt-2">$1,508.33</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Expense Categories</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#02031E]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">% of Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { category: 'Office Supplies', amount: 15000, percentage: 33.15, trend: 'up' },
              { category: 'Travel', amount: 12500, percentage: 27.62, trend: 'down' },
              { category: 'Utilities', amount: 8750, percentage: 19.34, trend: 'stable' },
              { category: 'Marketing', amount: 9000, percentage: 19.89, trend: 'up' },
            ].map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-xs text-gray-900">{item.category}</td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  ${item.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  {item.percentage.toFixed(2)}%
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.trend === 'up' ? 'bg-green-100 text-green-800' :
                      item.trend === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseReports; 