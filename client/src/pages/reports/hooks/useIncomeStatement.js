import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import BASE_URL from '../../../context/Api';

export const useIncomeStatement = () => {
  // State for real data from API
  const [incomeData, setIncomeData] = useState({
    revenue: [],
    expenses: [],
    pettyCashExpenses: [],
    accountsReceivable: [],
    accountsPayable: [],
    totals: {}
  });
  

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportType, setExportType] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    expenses: true
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouses, setSelectedBoardingHouses] = useState([]);
  const [isConsolidated, setIsConsolidated] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  // Custom date range
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);



  // API Functions

  const fetchBoardingHouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setBoardingHouses(response.data);
        // Don't automatically select a boarding house - keep consolidated view as default
        // The user can manually select a specific boarding house if needed
      }
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
      toast.error('Failed to fetch boarding houses');
    }
  };

  const fetchIncomeStatementData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        isConsolidated: isConsolidated.toString()
      });

      if (useCustomDateRange && dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      } else {
        const currentYear = new Date().getFullYear();
        params.append('year', currentYear);
      }

      if (!isConsolidated && selectedBoardingHouses.length > 0) {
        params.append('boardingHouseId', selectedBoardingHouses[0]);
      }

      const response = await axios.get(`${BASE_URL}/income-statement/generate?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        console.log('📊 Income Statement API Response:', response.data.data);
        setIncomeData(response.data.data);
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

  // Transform API data - preserve individual items with boarding house info for filtering
  const transformDataForDisplay = (apiData) => {
    console.log('🔄 Transforming data:', apiData);
    const transformedData = {
      revenue: [],
      expenses: []
    };

    // For consolidated view, keep individual items with boarding house info
    // For non-consolidated view, group by account
    if (isConsolidated) {
      // Keep individual revenue items with boarding house info
      transformedData.revenue = [
        ...(apiData.revenue || []).map(item => ({
          id: `${item.account_id}_${item.boarding_house_name}`,
          account_name: item.account_name,
          account_code: item.account_code,
          amount: item.amount || 0,
          boarding_house_name: item.boarding_house_name
        })),
        // Add accounts receivable items
        ...(apiData.accountsReceivable || []).map(item => ({
          id: `accounts_receivable_${item.boarding_house_name}`,
          account_name: 'Accounts Receivable',
          account_code: '12001',
          amount: item.overdue_amount || 0,
          boarding_house_name: item.boarding_house_name
        }))
      ];

      // Keep individual expense items with boarding house info
      transformedData.expenses = [
        ...(apiData.expenses || []).map(item => ({
          id: `${item.account_id}_${item.boarding_house_name}`,
          account_name: item.account_name,
          account_code: item.account_code,
          amount: item.amount || 0,
          boarding_house_name: item.boarding_house_name
        })),
        ...(apiData.pettyCashExpenses || []).map(item => ({
          id: `${item.account_id}_petty_${item.boarding_house_name}`,
          account_name: item.account_name,
          account_code: item.account_code,
          amount: item.amount || 0,
          boarding_house_name: item.boarding_house_name
        })),
        ...(apiData.accountsPayable || []).map(item => ({
          id: `${item.account_id}_payable_${item.boarding_house_name}`,
          account_name: item.account_name,
          account_code: item.account_code,
          amount: item.amount || 0,
          boarding_house_name: item.boarding_house_name
        }))
      ];
    } else {
      // Group by account for non-consolidated view (existing logic)
      const revenueGroups = {};
      apiData.revenue?.forEach(item => {
        const key = `${item.account_id}_${item.account_name}`;
        if (!revenueGroups[key]) {
          revenueGroups[key] = {
            id: item.account_id,
            account_name: item.account_name,
            account_code: item.account_code,
            amount: 0,
            boarding_house_name: item.boarding_house_name
          };
        }
        revenueGroups[key].amount += item.amount || 0;
      });

      // Add accounts receivable
      if (apiData.accountsReceivable && apiData.accountsReceivable.length > 0) {
        const totalReceivable = apiData.accountsReceivable.reduce((sum, item) => sum + (item.overdue_amount || 0), 0);
        if (totalReceivable > 0) {
          const boardingHouseName = apiData.accountsReceivable[0]?.boarding_house_name || 'N/A';
          revenueGroups['accounts_receivable'] = {
            id: 'accounts_receivable',
            account_name: 'Accounts Receivable',
            account_code: '12001',
            amount: totalReceivable,
            boarding_house_name: boardingHouseName
          };
        }
      }

      // Group expenses
      const expenseGroups = {};
      [...(apiData.expenses || []), ...(apiData.pettyCashExpenses || [])].forEach(item => {
        const key = `${item.account_id}_${item.account_name}`;
        if (!expenseGroups[key]) {
          expenseGroups[key] = {
            id: item.account_id,
            account_name: item.account_name,
            account_code: item.account_code,
            amount: 0,
            boarding_house_name: item.boarding_house_name
          };
        }
        expenseGroups[key].amount += item.amount || 0;
      });

      // Add accounts payable
      apiData.accountsPayable?.forEach(item => {
        const key = `${item.account_id}_${item.account_name}`;
        if (!expenseGroups[key]) {
          expenseGroups[key] = {
            id: item.account_id,
            account_name: item.account_name,
            account_code: item.account_code,
            amount: 0,
            boarding_house_name: item.boarding_house_name
          };
        }
        expenseGroups[key].amount += item.amount || 0;
      });

      transformedData.revenue = Object.values(revenueGroups);
      transformedData.expenses = Object.values(expenseGroups);
    }

    console.log('✅ Transformed data result:', transformedData);
    return transformedData;
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const transformedData = transformDataForDisplay(incomeData);
    
    const totalRevenue = transformedData.revenue.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = transformedData.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      transformedData,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses
    };
  }, [incomeData]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchBoardingHouses();
  }, []);

  useEffect(() => {
    // Fetch data when boarding houses are loaded and either:
    // 1. It's consolidated view (isConsolidated = true), or
    // 2. It's specific boarding house view and a boarding house is selected
    if (boardingHouses.length > 0 && (isConsolidated || (!isConsolidated && selectedBoardingHouses.length > 0))) {
      fetchIncomeStatementData();
    }
  }, [dateRange, selectedBoardingHouses, isConsolidated, boardingHouses, useCustomDateRange]);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  const handleExport = (type) => {
    setExportType(type);
    setShowExportModal(true);
  };

  return {
    // State
    incomeData,
    showExportModal,
    setShowExportModal,
    exportLoading,
    setExportLoading,
    exportType,
    setExportType,
    dateRange,
    setDateRange,
    boardingHouses,
    selectedBoardingHouses,
    setSelectedBoardingHouses,
    isConsolidated,
    setIsConsolidated,
    loading,
    error,
    useCustomDateRange,
    setUseCustomDateRange,
    expandedSections,
    calculations,
    
    // Functions
    fetchBoardingHouses,
    fetchIncomeStatementData,
    formatCurrency,
    toggleSection,
    handleExport
  };
};