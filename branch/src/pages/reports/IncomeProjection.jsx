import React, { useState, useEffect } from 'react';
import { FaFileDownload, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const IncomeProjection = () => {
  const [projectionPeriod, setProjectionPeriod] = useState('6');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Helper function to safely format numbers
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${value.toFixed(1)}%`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/reports/income-projection`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id'),
          months: projectionPeriod
        }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Error fetching income projection:', err);
      setError({
        message: err.response?.data?.message || 'Failed to fetch income projection',
        details: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectionPeriod]);

  const handleExport = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/reports/income-projection/export`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id'),
          months: projectionPeriod
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `income-projection-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting income projection:', err);
      setError({
        message: 'Failed to export report',
        details: err.response?.data?.error || err.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E78D69]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 font-medium">{error.message}</p>
        {error.details && (
          <p className="text-red-500 text-sm mt-2">{error.details}</p>
        )}
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Income Projection</h1>
        <p className="mt-1 text-xs text-gray-600">
          Future income forecasts and occupancy trends
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Total Projected Income</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(data?.summary?.total_projected)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Next {projectionPeriod} months</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Confirmed Income</p>
          <p className="text-lg font-semibold text-[#E78D69]">
            {formatCurrency(data?.summary?.total_confirmed)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatPercentage(data?.summary?.confirmed_percentage)} of projection</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Average Occupancy</p>
          <p className="text-lg font-semibold text-gray-900">{formatPercentage(data?.summary?.avg_occupancy)}</p>
          <p className="text-xs text-gray-500 mt-1">{data?.summary?.occupancy_trend}% vs current</p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <select
          value={projectionPeriod}
          onChange={(e) => setProjectionPeriod(e.target.value)}
          className="px-4 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
        >
          <option value="3">Next 3 Months</option>
          <option value="6">Next 6 Months</option>
          <option value="12">Next 12 Months</option>
        </select>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-xs text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaFileDownload className="h-3 w-3 mr-2" />
          Export Projection
        </button>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Monthly Projections</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#02031E]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Expected Income</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Confirmed Income</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Occupancy Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.projections?.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-xs text-gray-900">{item.month}</td>
                <td className="px-6 py-4 text-xs text-gray-900">{formatCurrency(item.expected_income)}</td>
                <td className="px-6 py-4 text-xs text-gray-900">{formatCurrency(item.confirmed_income)}</td>
                <td className="px-6 py-4 text-xs">
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium
                    ${item.occupancy_rate >= 90 ? 'bg-green-100 text-green-800' :
                      item.occupancy_rate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {formatPercentage(item.occupancy_rate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className={`inline-flex items-center ${
                    item.trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <FaChartLine className="h-3 w-3 mr-1" />
                    {item.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Projection Notes</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Projections based on current tenant contracts and historical occupancy rates</li>
          <li>• Confirmed income includes signed contracts and deposits received</li>
          <li>• Occupancy rates account for scheduled move-outs and confirmed new tenants</li>
          <li>• Trends calculated based on month-over-month comparison</li>
        </ul>
      </div>
    </div>
  );
};

export default IncomeProjection; 