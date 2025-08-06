import React, { useState, useEffect } from 'react';
import { FiDownload, FiSearch, FiCalendar, FiDollarSign, FiHome } from 'react-icons/fi';
import axios from 'axios';
import * as XLSX from 'xlsx';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const ExpensesReport = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');
  const [boardingHouses, setBoardingHouses] = useState([]);

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBoardingHouses(response.data);
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  const fetchExpensesReport = async () => {
    if (!selectedMonth || !selectedYear) {
      setError('Please select both month and year');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        month: selectedMonth,
        year: selectedYear
      };

      if (selectedBoardingHouse !== 'all') {
        params.boarding_house_id = selectedBoardingHouse;
      }

      const response = await axios.get(`${BASE_URL}/expenses/report/expenses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching expenses report:', error);
      setError(error.response?.data?.message || 'Failed to fetch expenses report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatMonthYear = (month, year) => {
    const monthName = months.find(m => m.value === month)?.label || '';
    return `${monthName} ${year}`;
  };

  const exportToExcel = () => {
    if (!reportData) return;

    try {
      // Create Excel data
      const excelData = [];
      
      // Add header
      excelData.push(['Expenses Report', formatMonthYear(selectedMonth, selectedYear)]);
      excelData.push([]);
      excelData.push(['Boarding House', 'Account Code', 'Account Name', 'Total Amount', 'Transaction Count']);

      // Add data
      reportData.boarding_houses.forEach(boardingHouse => {
        boardingHouse.accounts.forEach(account => {
          excelData.push([
            boardingHouse.boarding_house_name,
            account.account_code,
            account.account_name,
            account.total_amount,
            account.transaction_count
          ]);
        });
      });

      // Create and download Excel file
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses Report');
      XLSX.writeFile(wb, `expenses-report-${selectedMonth}-${selectedYear}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses Report</h1>
          <p className="text-sm text-gray-500">View expenses by month, year, and boarding house</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boarding House
            </label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
            >
              <option value="all">All Boarding Houses</option>
              {boardingHouses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchExpensesReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#E78D69] text-white text-sm hover:bg-[#E78D69]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Report Data */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Summary - {formatMonthYear(selectedMonth, selectedYear)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4">
                <div className="flex items-center">
                  <FiDollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(reportData.summary.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4">
                <div className="flex items-center">
                  <FiSearch className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {reportData.summary.total_transactions}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4">
                <div className="flex items-center">
                  <FiHome className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Boarding Houses</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {reportData.summary.boarding_house_count}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Report</h2>
            </div>
            <div className="overflow-x-auto">
              {reportData.boarding_houses.map((boardingHouse) => (
                <div key={boardingHouse.boarding_house_id} className="border-b border-gray-200">
                  <div className="bg-gray-50 px-6 py-4">
                    <h3 className="text-md font-semibold text-gray-900">
                      {boardingHouse.boarding_house_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {boardingHouse.boarding_house_location}
                    </p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        Total: {formatCurrency(boardingHouse.total_amount)}
                      </span>
                      <span className="text-gray-600">
                        Transactions: {boardingHouse.total_transactions}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-medium text-gray-700">Account Code</th>
                          <th className="text-left py-2 text-sm font-medium text-gray-700">Account Name</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-700">Amount</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boardingHouse.accounts.map((account) => (
                          <tr key={account.account_id} className="border-b border-gray-100">
                            <td className="py-2 text-sm text-gray-900">{account.account_code}</td>
                            <td className="py-2 text-sm text-gray-900">{account.account_name}</td>
                            <td className="py-2 text-sm text-gray-900 text-right">
                              {formatCurrency(account.total_amount)}
                            </td>
                            <td className="py-2 text-sm text-gray-900 text-right">
                              {account.transaction_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {reportData && reportData.boarding_houses.length === 0 && (
        <div className="bg-white border border-gray-200 p-6 text-center">
          <p className="text-gray-500">No expenses found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default ExpensesReport; 