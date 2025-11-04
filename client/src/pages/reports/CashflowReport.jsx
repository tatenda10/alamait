import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../context/Api';

const CashflowReport = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0, 1); // January 1st
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth(), 0); // Last day of current month
    return date.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCashflow, setShowCashflow] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('all');
  const [reportData, setReportData] = useState(null);

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setBoardingHouses(response.data);
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  const fetchCashflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = {
        start_date: startDate,
        end_date: endDate
      };

      // Add boarding house filter if not 'all'
      if (selectedBoardingHouse !== 'all') {
        params.boarding_house_id = selectedBoardingHouse;
      }

      console.log('Fetching monthly cashflow with params:', params);

      const response = await axios.get(`${BASE_URL}/reports/cashflow/monthly`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Monthly cashflow response:', response.data);
      setReportData(response.data);
      setShowCashflow(true);
    } catch (error) {
      console.error('Error fetching monthly cashflow data:', error);
      setError(error.response?.data?.message || 'Failed to load monthly cashflow data');
    } finally {
      setLoading(false);
    }
  };

  // Load boarding houses on component mount
  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      if (selectedBoardingHouse !== 'all') {
        params.append('boarding_house_id', selectedBoardingHouse);
      }

      const url = `${BASE_URL}/reports/cashflow/export?${params.toString()}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `cashflow-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError(error.response?.data?.message || 'Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="px-1 mt-2 py-2">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-500">Loading monthly cashflow data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 mt-2 py-2 w-full min-w-0">
      <div className="mb-2">
        <h1 className="text-sm font-bold text-gray-900">Monthly Cash Flow Statement</h1>
        <p className="mt-0.5 text-xs text-gray-600">
          Monthly breakdown from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mb-2 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Boarding House</label>
          <select
            value={selectedBoardingHouse}
            onChange={(e) => setSelectedBoardingHouse(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:border-transparent"
          >
            <option value="all">All Boarding Houses</option>
            {boardingHouses.map(bh => (
              <option key={bh.id} value={bh.id}>
                {bh.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCashflowData}
            disabled={loading}
            className="px-3 py-1 text-xs text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:ring-offset-2"
          >
            {loading ? 'Loading...' : 'Search Report'}
          </button>
          <button
            onClick={handleExport}
            disabled={!showCashflow}
            className="flex items-center px-3 py-1 text-xs text-white bg-[#f58020] hover:bg-[#f58020]/90 focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:ring-offset-2"
          >
            <FaFileDownload className="h-3 w-3 mr-1" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded">
          <div className="text-xs text-red-800">{error}</div>
        </div>
      )}

      {showCashflow && reportData && (
        <div className="bg-white border border-gray-200 w-full">
          <div className="p-1">
            <h2 className="text-xs font-bold text-gray-900 mb-1">Cash Flow Statement</h2>
            
            {/* Monthly columns header - scrollable container */}
            <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch', overflowY: 'visible', display: 'block' }}>
              <table className="text-xs" style={{ minWidth: `${250 + (reportData.months.length + 1) * 120}px`, width: 'max-content', tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 px-3 font-semibold text-gray-700 sticky left-0 bg-white z-20 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Account</th>
                    {reportData.months.map((month, idx) => (
                      <th key={idx} className="text-right py-1 px-3 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {month}
                      </th>
                    ))}
                    <th className="text-right py-1 px-3 font-semibold text-gray-700 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      FY-25
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Operating Activities - Income */}
                  <tr className="bg-blue-50">
                    <td colSpan={reportData.months.length + 2} className="py-1 px-3 font-bold text-gray-900">
                      Cash Flows from Operating Activities
                    </td>
                  </tr>
                  
                  {reportData.operatingActivities.income.map((item, idx) => (
                    <tr key={`income-${idx}`} className="border-b border-gray-200">
                      <td className="py-0.5 px-3 text-gray-700 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>{item.category}</td>
                      {item.monthlyValues.map((val, mIdx) => (
                        <td key={mIdx} className="py-0.5 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                          {val > 0 ? formatCurrency(val) : ''}
                        </td>
                      ))}
                      <td className="py-0.5 px-3 text-right font-semibold text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Total Rental Income */}
                  <tr className="border-b-2 border-gray-400 font-semibold">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Total Rental Income</td>
                    {reportData.operatingActivities.totals.operatingIncome.map((total, idx) => (
                      <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(total)}
                      </td>
                    ))}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.summary.totalOperatingIncome)}
                    </td>
                  </tr>

                  {/* Operating Activities - Expenses */}
                  <tr>
                    <td colSpan={reportData.months.length + 2} className="py-1 px-3 font-bold text-gray-900">
                      Operating Activities (Expenses)
                    </td>
                  </tr>

                  {reportData.operatingActivities.expenses.map((item, idx) => (
                    <tr key={`expense-${idx}`} className="border-b border-gray-200">
                      <td className="py-0.5 px-3 text-gray-700 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>{item.category}</td>
                      {item.monthlyValues.map((val, mIdx) => (
                        <td key={mIdx} className="py-0.5 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                          {val > 0 ? formatCurrency(val) : ''}
                        </td>
                      ))}
                      <td className="py-0.5 px-3 text-right font-semibold text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Total Cash Flows from Operating Activities */}
                  <tr className="border-b-2 border-gray-400 font-bold">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Total Cash Flows from Operating Activities</td>
                    {reportData.operatingActivities.totals.operatingNet.map((net, idx) => (
                      <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(net)}
                      </td>
                    ))}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.summary.totalOperatingIncome - reportData.summary.totalOperatingExpenses)}
                    </td>
                  </tr>

                  {/* Investing Activities */}
                  <tr className="bg-green-50">
                    <td colSpan={reportData.months.length + 2} className="py-1 px-3 font-bold text-gray-900">
                      Cash Flows From Investing Activities
                    </td>
                  </tr>

                  {reportData.investingActivities.length > 0 ? (
                    reportData.investingActivities.map((item, idx) => (
                      <tr key={`investing-${idx}`} className="border-b border-gray-200">
                        <td className="py-0.5 px-3 text-gray-700 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>{item.category}</td>
                        {item.monthlyValues.map((val, mIdx) => (
                          <td key={mIdx} className="py-0.5 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                            {val > 0 ? formatCurrency(val) : ''}
                          </td>
                        ))}
                        <td className="py-0.5 px-3 text-right font-semibold text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={reportData.months.length + 2} className="py-0.5 px-3 text-gray-500 text-center">
                        No investing activities
                      </td>
                    </tr>
                  )}

                  <tr className="border-b-2 border-gray-400 font-bold">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Total Cash Flows From Investing Activities</td>
                    {reportData.monthlyTotals.investing.map((total, idx) => (
                      <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(total)}
                      </td>
                    ))}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.summary.totalInvesting)}
                    </td>
                  </tr>

                  {/* Financing Activities */}
                  <tr className="bg-purple-50">
                    <td colSpan={reportData.months.length + 2} className="py-1 px-3 font-bold text-gray-900">
                      Cash Flows From Financing Activities
                    </td>
                  </tr>

                  {reportData.financingActivities.length > 0 ? (
                    reportData.financingActivities.map((item, idx) => (
                      <tr key={`financing-${idx}`} className="border-b border-gray-200">
                        <td className="py-0.5 px-3 text-gray-700 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>{item.category}</td>
                        {item.monthlyValues.map((val, mIdx) => (
                          <td key={mIdx} className="py-0.5 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                            {val > 0 ? formatCurrency(val) : ''}
                          </td>
                        ))}
                        <td className="py-0.5 px-3 text-right font-semibold text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={reportData.months.length + 2} className="py-0.5 px-3 text-gray-500 text-center">
                        No financing activities
                      </td>
                    </tr>
                  )}

                  <tr className="border-b-2 border-gray-400 font-bold">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Total Cash Flows From Financing Activities</td>
                    {reportData.monthlyTotals.financing.map((total, idx) => (
                      <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(total)}
                      </td>
                    ))}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.summary.totalFinancing)}
                    </td>
                  </tr>

                  {/* Net increase in cash */}
                  <tr className="border-b-2 border-gray-400 font-bold bg-yellow-50">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-yellow-50 z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Net increase in cash and cash equivalents</td>
                    {reportData.cashAtEndOfPeriod.map((cash, idx) => {
                      const prevCash = idx > 0 ? reportData.cashAtEndOfPeriod[idx - 1] : 0;
                      const increase = cash - prevCash;
                      return (
                        <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                          {formatCurrency(increase)}
                        </td>
                      );
                    })}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.cashAtEndOfPeriod[reportData.cashAtEndOfPeriod.length - 1] || 0)}
                    </td>
                  </tr>

                  {/* Cash at end of period */}
                  <tr className="border-b-2 border-gray-900 font-bold bg-blue-50">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-blue-50 z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Cash and cash equivalents at end of period</td>
                    {reportData.cashAtEndOfPeriod.map((cash, idx) => (
                      <td key={idx} className="py-1 px-3 text-right text-gray-900 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(cash)}
                      </td>
                    ))}
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.cashAtEndOfPeriod[reportData.cashAtEndOfPeriod.length - 1] || 0)}
                    </td>
                  </tr>

                  {/* Cash Breakdown */}
                  <tr className="bg-gray-100">
                    <td colSpan={reportData.months.length + 2} className="py-1 px-3 font-bold text-gray-900">
                      Cash Breakdown
                    </td>
                  </tr>

                  {reportData.cashBreakdown.accounts.map((account, idx) => (
                    <tr key={`cash-${idx}`} className="border-b border-gray-200">
                      <td className="py-0.5 px-3 text-gray-700 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>{account.name}</td>
                      <td colSpan={reportData.months.length} className="py-0.5 px-3 text-right text-gray-500"></td>
                      <td className="py-0.5 px-3 text-right font-semibold text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-b-2 border-gray-400 font-bold">
                    <td className="py-1 px-3 text-gray-900 sticky left-0 bg-white z-10 border-r-2 border-gray-300 whitespace-nowrap" style={{ minWidth: '250px', width: '250px' }}>Total</td>
                    <td colSpan={reportData.months.length} className="py-1 px-3 text-right text-gray-500"></td>
                    <td className="py-1 px-3 text-right text-gray-900 bg-gray-50 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>
                      {formatCurrency(reportData.cashBreakdown.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowReport;
