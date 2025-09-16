import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiSave, FiDownload, FiCalendar, FiFilter, FiRefreshCw } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import BASE_URL from '../../context/Api';

const IncomeStatement = () => {
  const navigate = useNavigate();
  
  // State
  const [incomeData, setIncomeData] = useState({
    revenue: [],
    expenses: [],
    pettyCashExpenses: [],
    accountsReceivable: [],
    accountsPayable: []
  });
  
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [statementName, setStatementName] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showIncomeStatement, setShowIncomeStatement] = useState(false);
  
  // Saved statements state
  const [savedStatements, setSavedStatements] = useState([]);
  const [selectedSavedStatement, setSelectedSavedStatement] = useState('');
  const [loadingSavedStatements, setLoadingSavedStatements] = useState(false);

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
      toast.error('Failed to fetch boarding houses');
    }
  };

  // Fetch income statement data
  const fetchIncomeStatementData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Determine if we're fetching consolidated data or specific boarding house
      const isConsolidated = selectedBoardingHouse === 'all';
      
      const params = new URLSearchParams({
        isConsolidated: isConsolidated.toString(),
        year: new Date().getFullYear()
      });

      // Add date range if provided
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      // Add boarding house filter if selected
      if (selectedBoardingHouse !== 'all') {
        params.append('boardingHouseId', selectedBoardingHouse);
        console.log('🔍 Filtering for boarding house ID:', selectedBoardingHouse);
      } else {
        console.log('🔍 Fetching data for all boarding houses');
      }

      console.log('📤 Request URL:', `${BASE_URL}/income-statement/generate?${params}`);
      
      const response = await axios.get(`${BASE_URL}/income-statement/generate?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        console.log('📊 Income Statement API Response:', response.data.data);
        setIncomeData(response.data.data);
        setShowIncomeStatement(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching income statement data:', error);
      setError(error.response?.data?.message || 'Failed to fetch income statement data');
      toast.error('Failed to fetch income statement data');
    } finally {
      setLoading(false);
    }
  };

  // Transform and filter data
  const getFilteredData = () => {
    const transformedData = {
      revenue: [],
      expenses: []
    };

    // Transform revenue data from the new API response format
    if (incomeData.revenue && incomeData.revenue.accounts) {
      console.log('🔍 Raw revenue accounts from API:', incomeData.revenue.accounts);
      transformedData.revenue = incomeData.revenue.accounts.map((item, index) => {
        const transformedItem = {
          id: `revenue_${index}`,
          account_name: item.account_name,
          account_code: item.account_code,
          account_id: item.account_id || item.id, // Try both account_id and id
          amount: item.amount || 0,
          type: 'revenue'
        };
        console.log('🔍 Transformed revenue item:', transformedItem);
        return transformedItem;
      });
    }

    // Transform expense data from the new API response format
    if (incomeData.expenses && incomeData.expenses.accounts) {
      console.log('🔍 Raw expense accounts from API:', incomeData.expenses.accounts);
      transformedData.expenses = incomeData.expenses.accounts.map((item, index) => {
        const transformedItem = {
          id: `expense_${index}`,
          account_name: item.account_name,
          account_code: item.account_code,
          account_id: item.account_id || item.id, // Try both account_id and id
          amount: item.amount || 0,
          type: 'expense'
        };
        console.log('🔍 Transformed expense item:', transformedItem);
        return transformedItem;
      });
    }

    return transformedData;
  };

  // Handle account code click
  const handleAccountClick = (account) => {
    console.log('🔍 handleAccountClick called with account:', account);
    console.log('🔍 Account ID:', account.account_id);
    console.log('🔍 Account Name:', account.account_name);
    console.log('🔍 Account Code:', account.account_code);
    console.log('🔍 Full account object:', JSON.stringify(account, null, 2));
    
    // Check if it's accounts payable
    if (account.account_name?.toLowerCase().includes('accounts payable') || 
        account.account_code?.toLowerCase().includes('payable')) {
      console.log('🚀 Navigating to creditors report');
      navigate('/dashboard/reports/creditors');
      return;
    }
    
    // Check if it's accounts receivable
    if (account.account_name?.toLowerCase().includes('accounts receivable') || 
        account.account_code?.toLowerCase().includes('receivable')) {
      console.log('🚀 Navigating to debtors report');
      navigate('/dashboard/reports/debtors');
      return;
    }
    
    // For other accounts (revenue or expense), navigate to account transactions
    if (account.account_id && account.account_id !== null) {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const navigationUrl = `/dashboard/account-transactions/${account.account_id}?${params.toString()}`;
      console.log('🚀 Navigating to account transactions:', navigationUrl);
      navigate(navigationUrl);
    } else {
      console.error('❌ Account ID not found for navigation');
      console.error('❌ Account details:', account);
      toast.error(`Account ID not found for ${account.account_name || account.account_code}. This account may not have transactions or the ID is missing.`);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    // Use the totals from the API response if available, otherwise calculate from filtered data
    if (incomeData.revenue && incomeData.expenses && incomeData.summary) {
      return {
        totalRevenue: incomeData.revenue.total || 0,
        totalExpenses: incomeData.expenses.total || 0,
        netIncome: incomeData.summary.netIncome || 0
      };
    } else {
      const data = getFilteredData();
      const totalRevenue = data.revenue.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalExpenses = data.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses
      };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!showIncomeStatement || !incomeData) {
      toast.error('Please generate an income statement first');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = [];
      
      // Add header
      excelData.push(['INCOME STATEMENT']);
      excelData.push([]);
      
      // Add date range
      const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : `${new Date().getFullYear()} (Full Year)`;
      excelData.push(['Date Range:', dateRange]);
      
      // Add boarding house info
      const boardingHouseInfo = selectedBoardingHouse === 'all' 
        ? 'All Boarding Houses (Consolidated)' 
        : boardingHouses.find(bh => bh.id.toString() === selectedBoardingHouse)?.name || 'N/A';
      excelData.push(['Boarding House:', boardingHouseInfo]);
      excelData.push([]);
      
      // Revenue section
      excelData.push(['REVENUE']);
      excelData.push(['Code', 'Account', 'Amount']);
      
      if (incomeData.revenue?.accounts) {
        incomeData.revenue.accounts.forEach(account => {
          excelData.push([
            account.account_code || '',
            account.account_name || '',
            account.amount || 0
          ]);
        });
      }
      
      excelData.push(['', 'TOTAL REVENUE', incomeData.revenue?.total || 0]);
      excelData.push([]);
      
      // Expenses section
      excelData.push(['EXPENSES']);
      excelData.push(['Code', 'Account', 'Amount']);
      
      if (incomeData.expenses?.accounts) {
        incomeData.expenses.accounts.forEach(account => {
          excelData.push([
            account.account_code || '',
            account.account_name || '',
            account.amount || 0
          ]);
        });
      }
      
      excelData.push(['', 'TOTAL EXPENSES', incomeData.expenses?.total || 0]);
      excelData.push([]);
      
      // Net Income
      excelData.push(['', 'NET INCOME', incomeData.summary?.netIncome || 0]);
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 15 }, // Code
        { width: 40 }, // Account
        { width: 20 }  // Amount
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Statement');
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `income-statement-${dateStr}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, filename);
      
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Fetch saved income statements
  const fetchSavedStatements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/income-statement/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setSavedStatements(response.data.statements || []);
      }
    } catch (error) {
      console.error('Error fetching saved statements:', error);
      toast.error('Failed to load saved statements');
    }
  };

  // Load a specific saved statement
  const loadSavedStatement = async (statementId) => {
    if (!statementId) return;
    
    setLoadingSavedStatements(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/income-statement/saved/${statementId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        const statement = response.data.statement;
        
        // Set the date range from saved statement
        if (statement.dateRange) {
          setStartDate(statement.dateRange.startDate);
          setEndDate(statement.dateRange.endDate);
        }
        
        // Set the boarding house selection
        if (statement.isConsolidated) {
          setSelectedBoardingHouse('all');
        } else if (statement.boardingHouseId) {
          setSelectedBoardingHouse(statement.boardingHouseId.toString());
        }
        
        // Load the exact API response
        if (statement.apiResponse) {
          setIncomeData(statement.apiResponse);
          setShowIncomeStatement(true);
        }
        
        toast.success(`Loaded saved statement: ${statement.name}`);
      }
    } catch (error) {
      console.error('Error loading saved statement:', error);
      toast.error('Failed to load saved statement');
    } finally {
      setLoadingSavedStatements(false);
    }
  };



  // Create new statement (clear current data)
  const createNewStatement = () => {
    setSelectedSavedStatement('');
    setSelectedBoardingHouse('all');
    fetchIncomeStatementData(); // Reload fresh data
    toast.info('Started new income statement');
  };

  // Save income statement
  const saveIncomeStatement = async () => {
    if (!statementName.trim()) {
      toast.error('Please enter a name for the income statement');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Use custom date range if provided, otherwise use current year
      const currentYear = new Date().getFullYear();
      const saveData = {
        name: statementName.trim(),
        startDate: startDate || `${currentYear}-01-01`,
        endDate: endDate || `${currentYear}-12-31`,
        boardingHouseId: selectedBoardingHouse === 'all' ? null : selectedBoardingHouse,
        isConsolidated: selectedBoardingHouse === 'all',
        apiResponse: incomeData // Save the exact API response
      };

      const response = await axios.post(`${BASE_URL}/income-statement/save`, saveData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        toast.success('Income statement saved successfully');
        setShowSaveModal(false);
        setStatementName('');
        // Refresh the saved statements list
        fetchSavedStatements();
      } else {
        throw new Error('Failed to save income statement');
      }
    } catch (error) {
      console.error('Error saving income statement:', error);
      toast.error(error.response?.data?.message || 'Failed to save income statement');
    } finally {
      setSaving(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBoardingHouses();
    fetchSavedStatements();
  }, []);

  // Reload data when boarding house filter changes
  useEffect(() => {
    if (boardingHouses.length > 0) {
      // Data is already loaded, just filter it
      console.log('Filtering data for boarding house:', selectedBoardingHouse);
    }
  }, [selectedBoardingHouse]);

  const filteredData = getFilteredData();
  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading income statement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-300 p-4 rounded">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchIncomeStatementData}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white">
        <div className="w-full px-8 py-4">
          {/* Top row - Title and Search Button */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm font-bold text-gray-900">Income Statement</h1>
            
            {/* Search Income Statement Button */}
            <button
              onClick={fetchIncomeStatementData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white transition-colors"
              style={{ backgroundColor: '#f58020' }}
            >
              <FiSearch size={14} />
              {loading ? 'Loading...' : 'Search Income Statement'}
            </button>
          </div>

          {/* Bottom row - Filters and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500" size={16} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Boarding House Filter */}
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-500" size={16} />
                <select
                  value={selectedBoardingHouse}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🏠 Boarding house selection changed to:', newValue);
                    setSelectedBoardingHouse(newValue);
                  }}
                  className="text-xs border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {/* <option value="all">All Boarding Houses</option> */}
                  {boardingHouses.map(bh => (
                    <option key={bh.id} value={bh.id}>
                      {bh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedSavedStatement}
                  onChange={(e) => setSelectedSavedStatement(e.target.value)}
                  disabled={loadingSavedStatements}
                  className="text-xs border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Saved Statement...</option>
                  {savedStatements.map((statement) => (
                    <option key={statement.id} value={statement.id}>
                      {statement.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => {
                    if (selectedSavedStatement) {
                      loadSavedStatement(selectedSavedStatement);
                    } else {
                      toast.error('Please select a statement to load');
                    }
                  }}
                  disabled={!selectedSavedStatement || loadingSavedStatements}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-white transition-colors"
                  style={{ backgroundColor: '#f58020' }}
                >
                  <FiDownload size={14} />
                  {loadingSavedStatements ? 'Loading...' : 'Load'}
                </button>
              </div>
              
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-white transition-colors"
                style={{ backgroundColor: '#f58020' }}
              >
                <FiSave size={14} />
                Save
              </button>
              
              <button
                onClick={exportToExcel}
                disabled={!showIncomeStatement || !incomeData}
                className="flex items-center gap-2 px-3 py-2 text-xs text-white transition-colors"
                style={{ backgroundColor: '#f58020' }}
              >
                <FiDownload size={14} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Table - Only show when income statement is requested */}
      {showIncomeStatement && (
        <div className="w-full px-8 py-6">
          <div className="bg-white border border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-3 py-3 text-left font-semibold text-xs">Account</th>
                    <th className="px-3 py-3 text-right font-semibold text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue Section Header */}
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <td className="px-3 py-3 font-bold text-gray-900 text-xs">
                      REVENUE
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900"></td>
                  </tr>
                  
                  {filteredData.revenue.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td 
                        className="px-3 py-2 text-gray-700 text-xs cursor-pointer hover:text-blue-600 hover:underline bg-gray-100"
                        onClick={() => handleAccountClick(item)}
                        title="Click to view account transactions"
                      >
                        {item.account_name}
                      </td>
                      <td className="px-3 py-2 text-right bg-gray-100">
                        <span className="text-gray-900 font-medium text-xs">{formatCurrency(item.amount || 0)}</span>
                      </td>
                    </tr>
                  ))}

                  {/* Revenue Total */}
                  <tr className="bg-gray-200 border-b-2 border-gray-400">
                    <td className="px-3 py-3 font-bold text-gray-900 text-xs">
                      TOTAL REVENUE
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs">
                      {formatCurrency(totals.totalRevenue)}
                    </td>
                  </tr>

                  {/* Expenses Section Header */}
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <td className="px-3 py-3 font-bold text-gray-900 text-xs">
                      EXPENSES
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900"></td>
                  </tr>
                  
                  {filteredData.expenses.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td 
                        className="px-3 py-2 text-gray-700 text-xs cursor-pointer hover:text-blue-600 hover:underline bg-gray-100"
                        onClick={() => handleAccountClick(item)}
                        title="Click to view account transactions"
                      >
                        {item.account_name}
                      </td>
                      <td className="px-3 py-2 text-right bg-gray-100">
                        <span className="text-gray-900 font-medium text-xs">{formatCurrency(item.amount || 0)}</span>
                      </td>
                    </tr>
                  ))}

                  {/* Expenses Total */}
                  <tr className="bg-gray-200 border-b-2 border-gray-400">
                    <td className="px-3 py-3 font-bold text-gray-900 text-xs">
                      TOTAL EXPENSES
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs">
                      {formatCurrency(totals.totalExpenses)}
                    </td>
                  </tr>

                  {/* Net Income Section */}
                  <tr className="bg-gray-300 border-b-2 border-gray-500">
                    <td className="px-3 py-3 font-bold text-gray-900 text-xs">NET INCOME</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs">
                      {formatCurrency(totals.netIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-[500px] mx-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Save Income Statement</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statement Name
              </label>
              <input
                type="text"
                value={statementName}
                onChange={(e) => setStatementName(e.target.value)}
                placeholder="Enter a name for this income statement..."
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setStatementName('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveIncomeStatement}
                disabled={saving || !statementName.trim()}
                className="px-4 py-2 text-white transition-colors"
                style={{ backgroundColor: '#f58020' }}
              >
                {saving ? 'Saving...' : 'Save Statement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeStatement;