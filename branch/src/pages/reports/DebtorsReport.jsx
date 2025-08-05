import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../utils/api';

const DebtorsReport = () => {
  const [dateRange, setDateRange] = useState('30');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/reports/debtors`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id'),
          days: dateRange,
          status: filterStatus
        }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Error fetching debtors report:', err);
      setError(err.response?.data?.message || 'Failed to fetch debtors report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, filterStatus]);

  const handleExport = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/reports/debtors/export`, {
        headers: getAuthHeaders(),
        params: {
          boarding_house_id: localStorage.getItem('boarding_house_id'),
          days: dateRange,
          status: filterStatus
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `debtors-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting debtors report:', err);
      setError('Failed to export report');
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
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Debtors Report</h1>
        <p className="mt-1 text-xs text-gray-600">
          Overview of all outstanding payments and overdue accounts
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Total Outstanding</p>
          <p className="text-lg font-semibold text-gray-900">
            ${data?.summary.total_outstanding.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Overdue Accounts</p>
          <p className="text-lg font-semibold text-red-600">
            {data?.summary.overdue_accounts}
          </p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Average Days Overdue</p>
          <p className="text-lg font-semibold text-gray-900">
            {data?.summary.avg_days_overdue} days
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial Payment</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-xs text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaFileDownload className="h-3 w-3 mr-2" />
          Export Report
        </button>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#02031E]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Total Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Days Overdue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Last Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.debtors.map((debtor) => (
              <tr key={debtor.student_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-xs text-gray-900">{debtor.student_name}</td>
                <td className="px-6 py-4 text-xs text-gray-900">{debtor.room_number}</td>
                <td className="px-6 py-4 text-xs text-gray-900">${debtor.total_due.toFixed(2)}</td>
                <td className="px-6 py-4 text-xs text-gray-900">{debtor.days_overdue} days</td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  {debtor.last_payment ? new Date(debtor.last_payment).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium
                    ${debtor.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      debtor.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {debtor.status.charAt(0).toUpperCase() + debtor.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
            {(!data?.debtors || data.debtors.length === 0) && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No debtors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebtorsReport; 